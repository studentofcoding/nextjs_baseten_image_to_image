"use client"
import { useState } from 'react';

const Home = () => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [positivePrompt, setPositivePrompt] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            newImages.push(e.target.result as string);
            if (newImages.length === files.length) {
              setUploadedImages((prev) => [...prev, ...newImages].slice(-2));
            }
          }
        };
        reader.readAsDataURL(files[i]);
      }
    }
  };

  const handleGenerate = async () => {
    setProcessing(true);
    try {
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_input_1: uploadedImages[0] || '',
          image_input_2: uploadedImages[1] || '',
          positive_prompt: positivePrompt,
        }),
      });

      if (!response.body) {
        alert('No response body');
        setProcessing(false);
        return;
      }

      const reader = response.body.getReader();
      const stream = new ReadableStream({
        start(controller) {
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              push();
            });
          }
          push();
        },
      });

      const newResponse = new Response(stream);
      const result = await newResponse.json();

      if (result && result.result && result.result[0] && result.result[0].data) {
        const imageData = result.result[0].data;
        setGeneratedImage(`data:image/png;base64,${imageData}`);
      } else {
        alert('Error: No image data found in the response.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while generating the profile image.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'generated_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="max-w-3xl w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Make me Pro</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Attach 2 images as references and add your prompt<br /> to generate your Professional image.
          </p>
        </div>
        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-muted p-8 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-4">Attach your photo</h2>
              <div className="w-full max-w-md">
                <div className="flex justify-center items-center w-full">
                  {uploadedImages.length > 1 ? (
                    <img
                      src={generatedImage || uploadedImages[1] || '/placeholder.svg'}
                      alt="Placeholder Image Result"
                      style={{ aspectRatio: '200 / 200', objectFit: 'cover' }}
                      className="rounded-md"
                    />
                  ) : (
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col justify-center items-center w-full h-64 bg-card-foreground border-2 border-muted border-dashed rounded-lg cursor-pointer dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col justify-center items-center pt-5 pb-6">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-10 h-10 text-muted-foreground mb-3"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" x2="12" y1="3" y2="15"></line>
                        </svg>
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
                      </div>
                      <input id="dropzone-file" className="hidden" type="file" multiple onChange={handleFileChange} />
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 relative">
                  <img
                    src={uploadedImages[0] || '/placeholder.svg'}
                    alt="Placeholder Image"
                    style={{ aspectRatio: '200 / 200', objectFit: 'cover' }}
                    className="rounded-md"
                  />
                  <img
                    src={uploadedImages[1] || '/placeholder.svg'}
                    alt="Placeholder Image"
                    style={{ aspectRatio: '200 / 200', objectFit: 'cover' }}
                    className="rounded-md"
                  />
                  {processing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white text-lg font-semibold">
                      Processing your Image...
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-8 flex flex-col items-center justify-start">
              <h2 className="text-2xl font-semibold mb-4">Enter your Prompt</h2>
              <div className="w-full max-w-md">
                <textarea
                  className="flex min-h-[80px] border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-md border-muted focus:border-primary focus:ring-primary"
                  id="positive_prompt"
                  placeholder="for example: photograph of a man, handsome, see at viewer, smiling, looking professional, asian man, without moles on face, without glasses, blurry background"
                  rows={12}
                  value={positivePrompt}
                  onChange={(e) => setPositivePrompt(e.target.value)}
                ></textarea>
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4 w-full"
                >
                  Generate Your Profile
                </button>
                <button
                  onClick={handleDownload}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-4 py-2 mt-4 w-full ${generatedImage ? '' : 'hidden'}`}
                >
                  Download Your Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;