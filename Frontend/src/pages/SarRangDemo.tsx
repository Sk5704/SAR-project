import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, AlertCircle, ImageIcon } from "lucide-react";

import example1Grayscale from "@/assets/grayscale-1.png";
import example1Colorized from "@/assets/coloured-1.png";
import example2Grayscale from "@/assets/grayscale-2.png";
import example2Colorized from "@/assets/coloured-2.png";
import example3Grayscale from "@/assets/grayscale-3.png";
import example3Colorized from "@/assets/coloured-3.png";
import example4Grayscale from "@/assets/grayscale-4.png";
import example4Colorized from "@/assets/coloured-4.png";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/tiff"];
const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.tiff,.tif";

const GALLERY_EXAMPLES = [
  {
    grayscale: example1Grayscale,
    colorized: example1Colorized,
    title: "Class 1  Grassland",
    description:
      "Moderate radar backscatter from vegetation produces soft tonal mapping, highlighting natural cover regions.",
  },
  {
    grayscale: example2Grayscale,
    colorized: example2Colorized,
    title: "Class 2  Urban Area",
    description:
      "Strong reflections from buildings and structures generate high-intensity responses mapped to colors.",
  },
  {
    grayscale: example3Grayscale,
    colorized: example3Colorized,
    title: "Class 3  Barren Land",
    description:
      "Low texture and uniform reflectance regions are assigned neutral tones for minimal surface complexity.",
  },
  {
    grayscale: example4Grayscale,
    colorized: example4Colorized,
    title: "Class 4  Agricultural Land",
    description:
      "Periodic crop patterns create repeating radar signatures resulting in structured color variations.",
  },
];

const SarRangDemo = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(tiff?|png|jpe?g)$/i)) {
      return "Invalid file format. Please upload a PNG, JPG, or TIFF image.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File size exceeds 10 MB limit (${(f.size / 1024 / 1024).toFixed(1)} MB).`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validationError = validateFile(selected);
    if (validationError) {
      setError(validationError);
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleProcess = async () => {
    if (!file) return;
    setError(null);
    setLoading(true);

    const API_BASE = "https://anni00710-sar2optical.hf.space";

    try {
      // Step 1: Upload file to Gradio's upload endpoint
      const uploadForm = new FormData();
      uploadForm.append("files", file, file.name);

      const uploadResponse = await fetch(`${API_BASE}/gradio_api/upload`, {
        method: "POST",
        body: uploadForm,
      });

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 503) {
          throw new Error("The SAR colorization service is currently unavailable. Please try again in a few minutes.");
        }
        throw new Error(`Upload failed (${uploadResponse.status})`);
      }

      const uploadedFiles: string[] = await uploadResponse.json();
      if (!uploadedFiles?.[0]) throw new Error("Failed to upload image to the service.");

      // Step 2: Submit the job referencing the uploaded file
      const submitResponse = await fetch(`${API_BASE}/gradio_api/call/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{
            path: uploadedFiles[0],
            orig_name: file.name,
            size: file.size,
            mime_type: file.type || "image/png",
            meta: { _type: "gradio.FileData" },
          }],
        }),
      });

      if (!submitResponse.ok) {
        if (submitResponse.status === 503) {
          throw new Error("The SAR colorization service is currently unavailable. Please try again in a few minutes.");
        }
        const errText = await submitResponse.text().catch(() => "");
        throw new Error(errText || `Server error (${submitResponse.status})`);
      }

      const submitData = await submitResponse.json();
      const eventId = submitData?.event_id;
      if (!eventId) throw new Error("Failed to submit image for processing.");

      // Step 3: Poll for result via SSE
      const resultResponse = await fetch(`${API_BASE}/gradio_api/call/convert/${eventId}`);
      if (!resultResponse.ok) throw new Error(`Failed to retrieve result (${resultResponse.status})`);

      const resultText = await resultResponse.text();
      const lines = resultText.split("\n");

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("event: error")) {
          const dataLine = lines[i + 1];
          const errMsg = dataLine?.startsWith("data: ") ? dataLine.slice(6) : "Processing failed.";
          throw new Error(errMsg === "null" ? "The model failed to process this image." : errMsg);
        }
        if (lines[i].startsWith("event: complete")) {
          const dataLine = lines[i + 1];
          if (dataLine?.startsWith("data: ")) {
            const parsed = JSON.parse(dataLine.slice(6));
            const output = parsed?.[0] ?? parsed?.data?.[0];
            if (output?.url) {
              setResult(output.url);
              return;
            }
          }
          break;
        }
      }

      throw new Error("No colorized image returned. Please try a different SAR image.");
    } catch (err: any) {
      setError(err.message || "An error occurred while processing the image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const response = await fetch(result);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `colorized-${file?.name || "result.png"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(result, "_blank");
    }
  };

  return (
    <Layout>
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 text-center">
            SAR-RANG: SAR Image Colorization
          </h1>

          {/* Disclaimer */}
          <div className="glass rounded-xl p-4 mb-10 border border-primary/20">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              <strong className="text-foreground">Disclaimer:</strong> This system performs SAR image colorization to enhance interpretability. It does not generate optical imagery and preserves radar-specific characteristics.
            </p>
          </div>

           {/* Instructions */}
           <div className="mb-10">
             <h2 className="font-display text-2xl font-semibold mb-5">Instructions</h2>
              <ol className="list-decimal list-inside space-y-3 text-base text-muted-foreground leading-relaxed">
               <li>Upload a grayscale SAR image (PNG, JPG, or TIFF).</li>
               <li>Ensure the image is radiometrically calibrated and normalized SAR data.</li>
               <li>Click <strong className="text-foreground">Process Image</strong> to run the SAR-RANG model.</li>
               <li>Review the output and download the colorized result.</li>
             </ol>
           </div>

           {/* Gallery */}
          <div className="mb-14">
            <h2 className="font-display text-2xl font-semibold mb-3">
              Example Transformations
            </h2>

            <p className="text-base text-muted-foreground mb-10 leading-relaxed max-w-2xl">
              Below examples demonstrate how SAR-RANG assigns meaningful color representations
              based on radar reflectance characteristics rather than hallucinated optical imagery.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-14">
              {GALLERY_EXAMPLES.map((example, idx) => (
                <div key={idx} className="space-y-4">

                  <div>
                    <p className="text-lg font-semibold text-foreground">{example.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {example.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Grayscale */}
                    <div className="text-center">
                      <p className="text-s text-muted-foreground mb-1">SAR Input</p>
                      <div className="glass rounded-xl p-2">
                        <img
                          src={example.grayscale}
                          alt={`Grayscale ${example.title}`}
                          className="rounded-lg h-64 w-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Colorized */}
                    <div className="text-center">
                      <p className="text-s text-muted-foreground mb-1">Colorized Output</p>
                      <div className="glass rounded-xl p-2">
                        <img
                          src={example.colorized}
                          alt={`Colorized ${example.title}`}
                          className="rounded-lg h-64 w-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div className="mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full glass rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors p-10 flex flex-col items-center gap-3 cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {file ? file.name : "Click to upload a grayscale SAR image"}
              </span>
              <span className="text-xs text-muted-foreground/60">
                PNG, JPG, or TIFF — Max 10 MB
              </span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Previews Side by Side */}
          {preview && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input */}
                <div>
                  <p className="text-sm font-medium mb-2">SAR Input</p>
                  <div className="glass rounded-xl p-2">
                    <img src={preview} alt="Uploaded SAR input" className="rounded-lg w-full h-64 object-cover" />
                  </div>
                </div>

                {/* Output */}
                <div>
                  <p className="text-sm font-medium mb-2">Colorized Output</p>
                  <div className="glass rounded-xl p-2 h-[calc(100%-1.75rem)] flex items-center justify-center">
                    {result ? (
                      <img src={result} alt="Colorized SAR output" className="rounded-lg w-full h-64 object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground/50 py-10">
                        <ImageIcon className="h-8 w-8" />
                        <span className="text-sm">Result will appear here</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Process Button */}
          {file && !result && (
            <div className="mb-10">
              <Button
                variant="hero"
                size="lg"
                onClick={handleProcess}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5" />
                    Process Image
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Download */}
          {result && (
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={handleDownload}>
                <Download className="h-5 w-5" />
                Download Result
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  setResult(null);
                  setError(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Test Another
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default SarRangDemo;
