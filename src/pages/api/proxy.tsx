import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dqudpzjsl',
  api_key: '668683935975374',
  api_secret: 'iGm_8ghU0EcDW5fQFeajQdZG_Ns',
});

async function uploadToCloudinary(image: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(image, { resource_type: 'image' }, (error, result) => {
      if (error) {
        reject(new Error('Failed to upload image to Cloudinary'));
      } else {
        if (result) {
          console.log('Uploaded image to Cloudinary:', result);
          resolve(result.secure_url);
          // reject(new Error('Result is get'));
        } else {
          reject(new Error('Result is undefined'));
        }
      }
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { image_input_1, image_input_2, positive_prompt } = req.body;

    try {
      // console.log('Received request with body:', req.body);

      const imageUrl1 = await uploadToCloudinary(image_input_1);
      const imageUrl2 = await uploadToCloudinary(image_input_2);
      console.log('Uploaded image URLs:', imageUrl1, imageUrl2);

      const response = await fetch('https://model-8w6x27yw.api.baseten.co/development/predict', {
        method: 'POST',
        headers: {
          'Authorization': 'Api-Key 0YkrJ8jX.9u3sd0jyWLriI7EzyQb1jbcqkcJr6bvH',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow_values: {
            image_input_1: imageUrl1,
            image_input_2: imageUrl2,
            positive_prompt,
            negative_prompt: 'text, watermark',
          },
        }),
      });

      if (!response.body) {
        console.error('No response body from external API');
        res.status(500).json({ error: 'No response body from external API' });
        return;
      }

      const buffer = await response.buffer();
      const result = JSON.parse(buffer.toString());

      console.log('Received result from external API:', result);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error occurred while processing the request:', error);
      res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}