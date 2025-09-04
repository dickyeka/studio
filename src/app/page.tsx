'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  XCircle,
  Loader,
  Sparkles,
  Download,
  PartyPopper,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { ImageUpload } from '@/components/image-upload';
import { displayApiStatus } from '@/ai/flows/display-api-status';
import { generateImagesFromPrompt } from '@/ai/flows/generate-images-from-prompt';

type Mode = 'lookbook' | 'b-roll';
type Gender = 'Male' | 'Female';

const THEMES = [
  'Studio Professional', 'Urban Street Style', 'Outdoor Lifestyle', 'Minimalist & Artsy',
  'Elegant & Luxury', 'Casual Everyday', 'Vintage Retro', 'Bohemian Free Spirit'
];
const LIGHTING_STYLES = [
  'Studio Lighting', 'Natural Daylight', 'Golden Hour', 'Dramatic Shadows',
  'Soft Diffused', 'Neon Urban', 'Moody Dark', 'Bright & Airy'
];
const MALE_MODELS = ['👨🏻', '👨🏼', '👨🏽', '👨🏾', '👨🏿', '🧔🏻‍♂️'];
const FEMALE_MODELS = ['👩🏻', '👩🏼', '👩🏽', '👩🏾', '👩🏿', '👱‍♀️'];

const GlassCard: FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg transition-all duration-300',
      className
    )}
  >
    {children}
  </div>
);

export default function ProductStudioPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('lookbook');
  const [productImage, setProductImage] = useState<{
    data: string;
    name: string;
  } | null>(null);
  const [modelImage, setModelImage] = useState<{
    data: string;
    name: string;
  } | null>(null);
  const [selectedGender, setSelectedGender] = useState<Gender>('Female');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(
    FEMALE_MODELS[0]
  );
  const [theme, setTheme] = useState<string>(THEMES[0]);
  const [lighting, setLighting] = useState<string>(LIGHTING_STYLES[0]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    isConnected: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const status = await displayApiStatus();
        setApiStatus({
          isConnected: status.isConnected,
          message: status.errorMessage,
        });
      } catch (error) {
        setApiStatus({
          isConnected: false,
          message: 'Failed to connect to API.',
        });
      }
    };
    checkApi();
  }, []);

  const handleGenerate = async () => {
    if (!productImage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please upload a product image first.',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedImages([]);

    let prompt = `Generate a high-resolution, photorealistic image. Theme: ${theme}. Lighting: ${lighting}.`;
    if (mode === 'lookbook') {
        prompt += ` This is a lookbook shoot.`;
        if (modelImage) {
            prompt += ` The model should resemble the person in the provided model photo.`;
        } else {
            prompt += ` Feature a ${selectedGender.toLowerCase()} model.`;
        }
    } else {
        prompt += ` This is a B-roll product shot. Focus on a dynamic and appealing presentation of the product in a lifestyle context.`;
    }
    prompt += ` Ensure the final image is polished, professional, and unique in composition.`

    try {
      const result = await generateImagesFromPrompt({
        productImageDataUri: productImage.data,
        prompt: prompt,
        modelGender: mode === 'lookbook' ? selectedGender : undefined,
        modelAvatar: mode === 'lookbook' ? modelImage?.data : undefined,
      });

      if (result.generatedImages && result.generatedImages.length > 0) {
        setGeneratedImages(result.generatedImages);
        toast({
            title: 'Success!',
            description: 'Your images have been generated.',
            action: <PartyPopper className="text-accent" />,
          });
      } else {
        throw new Error('The AI returned no images. Please try again.');
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentModels = useMemo(
    () => (selectedGender === 'Male' ? MALE_MODELS : FEMALE_MODELS),
    [selectedGender]
  );

  useEffect(() => {
    if (!modelImage) {
      setSelectedAvatar(currentModels[0]);
    }
  }, [currentModels, modelImage]);
  
  const ControlPanel = () => (
    <GlassCard className="p-6 space-y-8 sticky top-8">
      <div>
        <Label className="text-lg font-headline">Mode</Label>
        <RadioGroup
          value={mode}
          onValueChange={(value: string) => setMode(value as Mode)}
          className="mt-2 grid grid-cols-2 gap-2"
        >
          <Label
            htmlFor="lookbook"
            className={cn(
              'p-4 rounded-lg border-2 text-center cursor-pointer transition-all',
              mode === 'lookbook'
                ? 'bg-primary/20 border-primary'
                : 'border-transparent hover:bg-white/10'
            )}
          >
            <RadioGroupItem value="lookbook" id="lookbook" className="sr-only" />
            Lookbook
          </Label>
          <Label
            htmlFor="b-roll"
            className={cn(
              'p-4 rounded-lg border-2 text-center cursor-pointer transition-all',
              mode === 'b-roll'
                ? 'bg-primary/20 border-primary'
                : 'border-transparent hover:bg-white/10'
            )}
          >
            <RadioGroupItem value="b-roll" id="b-roll" className="sr-only" />
            B-Roll
          </Label>
        </RadioGroup>
      </div>

      <Separator className="bg-white/10" />

      <div className="space-y-4">
        <h3 className="text-lg font-headline">Uploads</h3>
        <ImageUpload
          label="Product Image"
          preview={productImage?.data ?? null}
          onImageUpload={(data, name) => setProductImage({ data, name })}
          onImageRemove={() => setProductImage(null)}
        />
        {mode === 'lookbook' && (
          <ImageUpload
            label="Custom Model (Optional)"
            preview={modelImage?.data ?? null}
            onImageUpload={(data, name) => setModelImage({ data, name })}
            onImageRemove={() => setModelImage(null)}
          />
        )}
      </div>

      {mode === 'lookbook' && (
        <>
          <Separator className="bg-white/10" />
          <div className="space-y-4">
            <h3 className="text-lg font-headline">Model Selection</h3>
            <RadioGroup
              value={selectedGender}
              onValueChange={(value: string) =>
                setSelectedGender(value as Gender)
              }
              className="mt-2 grid grid-cols-2 gap-4"
              disabled={!!modelImage}
            >
              <div>
                <RadioGroupItem value="Male" id="male" className="sr-only" />
                <Label htmlFor="male" className={cn( 'flex items-center justify-center p-2 rounded-md cursor-pointer', selectedGender === 'Male' ? 'bg-primary text-primary-foreground' : 'bg-white/10')}>
                  Male
                </Label>
              </div>
              <div>
                <RadioGroupItem value="Female" id="female" className="sr-only" />
                <Label htmlFor="female" className={cn('flex items-center justify-center p-2 rounded-md cursor-pointer', selectedGender === 'Female' ? 'bg-primary text-primary-foreground' : 'bg-white/10')}>
                  Female
                </Label>
              </div>
            </RadioGroup>
            <div className="grid grid-cols-3 gap-2">
              {currentModels.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  disabled={!!modelImage}
                  className={cn(
                    'aspect-square text-4xl rounded-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed',
                    selectedAvatar === avatar && !modelImage
                      ? 'bg-primary/20 ring-2 ring-primary'
                      : 'bg-white/5 hover:bg-white/10'
                  )}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator className="bg-white/10" />

      <div className="space-y-4">
        <h3 className="text-lg font-headline">Customization</h3>
        <div className="space-y-2">
          <Label htmlFor="theme-select">Photoshoot Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger id="theme-select">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lighting-select">Lighting Style</Label>
          <Select value={lighting} onValueChange={setLighting}>
            <SelectTrigger id="lighting-select">
              <SelectValue placeholder="Select a lighting style" />
            </SelectTrigger>
            <SelectContent>
              {LIGHTING_STYLES.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button
        size="lg"
        className="w-full text-lg font-headline bg-accent hover:bg-accent/90 text-accent-foreground"
        onClick={handleGenerate}
        disabled={isLoading || !productImage}
      >
        {isLoading ? (
          <Loader className="animate-spin" />
        ) : (
          <Sparkles className="mr-2" />
        )}
        Generate
      </Button>
    </GlassCard>
  );
  
  const ResultsPanel = () => (
     <GlassCard className="p-6 min-h-[60vh]">
      <h2 className="font-headline text-3xl mb-6">Results</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
          ))}
        {!isLoading && generatedImages.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground p-12 space-y-4 border-2 border-dashed rounded-lg">
                <Sparkles className="w-16 h-16"/>
                <h3 className="text-xl font-headline">Your creations will appear here</h3>
                <p>Configure your settings on the left and start generating!</p>
            </div>
        )}
        {!isLoading &&
          generatedImages.map((src, i) => (
            <Card
              key={i}
              className="overflow-hidden group relative border-0 bg-transparent"
            >
              <CardContent className="p-0">
                <Image
                  src={src}
                  alt={`Generated image ${i + 1}`}
                  width={450}
                  height={600}
                  data-ai-hint="product photo"
                  className="aspect-[3/4] w-full h-auto object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button asChild size="icon">
                    <a
                      href={src}
                      download={`gemini-product-studio-${productImage?.name}-${i+1}.png`}
                      aria-label="Download image"
                    >
                      <Download />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </GlassCard>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-headline tracking-tight">
            Gemini Product Studio
          </h1>
          <div className="flex items-center space-x-2">
            {apiStatus === null ? (
              <Loader className="animate-spin text-muted-foreground" />
            ) : apiStatus.isConnected ? (
              <>
                <CheckCircle2 className="text-green-400" />
                <span className="text-sm text-green-400">API Connected</span>
              </>
            ) : (
              <>
                <XCircle className="text-red-400" />
                <span className="text-sm text-red-400">API Disconnected</span>
              </>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4 xl:col-span-3">
            <ControlPanel />
          </aside>
          <main className="lg:col-span-8 xl:col-span-9">
             <ResultsPanel />
          </main>
        </div>
      </div>
    </div>
  );
}
