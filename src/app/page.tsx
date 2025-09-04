'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FC } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader,
  Sparkles,
  PartyPopper,
  Moon,
  Sun,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import { ImageUpload } from '@/components/image-upload';
import { displayApiStatus } from '@/ai/flows/display-api-status';
import { generateImagesFromPrompt } from '@/ai/flows/generate-images-from-prompt';

type Mode = 'lookbook' | 'b-roll';
type ThemeMode = 'dark' | 'light';
type ImageRatio = '1:1' | '4:3' | '16:9' | '3:4' | '9:16';
type Gender = 'male' | 'female';

const THEMES = [
  'Studio Professional', 'Urban Street Style', 'Outdoor Lifestyle', 'Minimalist & Artsy',
  'Elegant & Luxury', 'Casual Everyday', 'Vintage Retro', 'Bohemian Free Spirit'
];
const LIGHTING_STYLES = [
  'Studio Lighting', 'Natural Daylight', 'Golden Hour', 'Dramatic Shadows',
  'Soft Diffused', 'Neon Urban', 'Moody Dark', 'Bright & Airy'
];
const IMAGE_RATIOS = [
  { value: '1:1', label: 'Square (1:1)', description: 'Perfect for Instagram posts' },
  { value: '4:3', label: 'Standard (4:3)', description: 'Classic photography format' },
  { value: '16:9', label: 'Widescreen (16:9)', description: 'Cinematic landscape' },
  { value: '3:4', label: 'Portrait (3:4)', description: 'Vertical composition' },
  { value: '9:16', label: 'Mobile (9:16)', description: 'Instagram Stories/TikTok' },
];

const MALE_MODELS = [
  '👨‍💼', '🧔', '👨‍🎨', '👨‍💻', '🧑‍🦱', '👨‍🦲', '👨‍🦳', '🧑‍🦰'
];

const FEMALE_MODELS = [
  '👩‍💼', '👩‍🎨', '👩‍💻', '👩‍🦱', '👩‍🦲', '👩‍🦳', '👩‍🦰', '👸'
];

const GlassCard: FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div
    className={cn(
      'bg-black/20 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 dark:border-white/10 shadow-lg transition-all duration-300',
      'dark:text-white text-black',
      className
    )}
  >
    {children}
  </div>
);

export default function ProductStudioPage() {
  const { toast } = useToast();
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [mode, setMode] = useState<Mode>('lookbook');
  const [productImage, setProductImage] = useState<{
    data: string;
    name: string;
  } | null>(null);
  const [modelImage, setModelImage] = useState<{
    data: string;
    name: string;
  } | null>(null);
  const [theme, setTheme] = useState<string>(THEMES[0]);
  const [lighting, setLighting] = useState<string>(LIGHTING_STYLES[0]);
  const [imageRatio, setImageRatio] = useState<ImageRatio>('4:3');
  const [numImages, setNumImages] = useState(6);
  const [selectedGender, setSelectedGender] = useState<Gender>('female');
  const [selectedModelAvatar, setSelectedModelAvatar] = useState<string>('👩‍💼');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    isConnected: boolean;
    message?: string;
  } | null>(null);
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  useEffect(() => {
    document.documentElement.className = themeMode;
  }, [themeMode]);

  useEffect(() => {
    const checkApi = async () => {
      setIsCheckingApi(true);
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
      } finally {
        setIsCheckingApi(false);
      }
    };
    checkApi();
  }, []);

  const handleRefreshApiStatus = async () => {
    setIsCheckingApi(true);
    try {
      const status = await displayApiStatus();
      setApiStatus({
        isConnected: status.isConnected,
        message: status.errorMessage,
      });
      toast({
        title: status.isConnected ? 'API Connected' : 'API Disconnected',
        description: status.errorMessage || (status.isConnected ? 'API is working properly' : 'Please check your configuration'),
        variant: status.isConnected ? 'default' : 'destructive',
      });
    } catch (error) {
      setApiStatus({
        isConnected: false,
        message: 'Failed to connect to API.',
      });
      toast({
        title: 'API Check Failed',
        description: 'Unable to check API status',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingApi(false);
    }
  };

  const handleCopyPrompt = async (prompt: string, index: number) => {
    try {
      // Only Gemini format - clean prompt text
      await navigator.clipboard.writeText(prompt);
      setCopiedIndex(index);
      toast({
        title: '300-Word Prompt Copied!',
        description: 'The detailed prompt with image reference has been copied and is ready for use.',
      });
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Unable to copy prompt to clipboard.',
      });
    }
  };

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
    setGeneratedPrompts([]);
    setCopiedIndex(null);

    const selectedRatioInfo = IMAGE_RATIOS.find(r => r.value === imageRatio);
    let prompt = `${theme} style, ${lighting}, ${imageRatio} format`;
    if (mode === 'lookbook') {
        if (modelImage) {
            prompt += `, custom model`;
        } else {
            prompt += `, ${selectedGender} model`;
        }
    } else {
        prompt += `, product focus, lifestyle context`;
    }

    try {
      const result = await generateImagesFromPrompt({
        productImageDataUri: productImage.data,
        prompt: prompt,
        imageRatio: imageRatio,
        modelAvatar: mode === 'lookbook' ? (modelImage?.data || selectedModelAvatar) : undefined,
        modelGender: mode === 'lookbook' ? selectedGender : undefined,
        numImages: numImages,
      });

      if (result.generatedImages && result.generatedImages.length > 0) {
        setGeneratedImages(result.generatedImages);
        setGeneratedPrompts(result.generatedPrompts || []);
        toast({
            title: '300-Word Prompts Generated!',
            description: `${result.generatedPrompts?.length || numImages} detailed 300-word prompts with image references ready.`,
            action: <PartyPopper className="text-accent" />,
          });
      } else {
        throw new Error('The AI returned no results. Please try again.');
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
                : 'border-transparent hover:bg-white/10 dark:hover:bg-white/10'
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
                : 'border-transparent hover:bg-white/10 dark:hover:bg-white/10'
            )}
          >
            <RadioGroupItem value="b-roll" id="b-roll" className="sr-only" />
            B-Roll
          </Label>
        </RadioGroup>
      </div>

      <Separator className="bg-white/10 dark:bg-white/10" />

      <div className="space-y-4">
        <h3 className="text-lg font-headline">Uploads</h3>
        <ImageUpload
          label="Product Image"
          preview={productImage?.data ?? null}
          onImageUpload={(data, name) => setProductImage({ data, name })}
          onImageRemove={() => setProductImage(null)}
        />
        {mode === 'lookbook' && (
          <>
            <ImageUpload
              label="Custom Model (Optional)"
              preview={modelImage?.data ?? null}
              onImageUpload={(data, name) => setModelImage({ data, name })}
              onImageRemove={() => setModelImage(null)}
            />
            {!modelImage && (
              <div className="space-y-4">
                <h4 className="text-md font-headline">Model Selection</h4>
                <div className="space-y-3">
                  <Label>Gender</Label>
                  <RadioGroup
                    value={selectedGender}
                    onValueChange={(value: string) => {
                      const gender = value as Gender;
                      setSelectedGender(gender);
                      // Set default avatar for selected gender
                      setSelectedModelAvatar(gender === 'male' ? MALE_MODELS[0] : FEMALE_MODELS[0]);
                    }}
                    className="flex gap-4"
                  >
                    <Label
                      htmlFor="female"
                      className={cn(
                        'p-3 rounded-lg border-2 text-center cursor-pointer transition-all flex-1',
                        selectedGender === 'female'
                          ? 'bg-primary/20 border-primary'
                          : 'border-transparent hover:bg-white/10 dark:hover:bg-white/10'
                      )}
                    >
                      <RadioGroupItem value="female" id="female" className="sr-only" />
                      Female
                    </Label>
                    <Label
                      htmlFor="male"
                      className={cn(
                        'p-3 rounded-lg border-2 text-center cursor-pointer transition-all flex-1',
                        selectedGender === 'male'
                          ? 'bg-primary/20 border-primary'
                          : 'border-transparent hover:bg-white/10 dark:hover:bg-white/10'
                      )}
                    >
                      <RadioGroupItem value="male" id="male" className="sr-only" />
                      Male
                    </Label>
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>Model Avatar</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(selectedGender === 'male' ? MALE_MODELS : FEMALE_MODELS).map((avatar, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="lg"
                        className={cn(
                          'h-12 text-2xl',
                          selectedModelAvatar === avatar
                            ? 'bg-primary/20 border-primary'
                            : 'hover:bg-white/10 dark:hover:bg-white/10'
                        )}
                        onClick={() => setSelectedModelAvatar(avatar)}
                      >
                        {avatar}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Separator className="bg-white/10 dark:bg-white/10" />

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
        <div className="space-y-2">
          <Label htmlFor="ratio-select">Image Aspect Ratio</Label>
          <Select value={imageRatio} onValueChange={(value: ImageRatio) => setImageRatio(value)}>
            <SelectTrigger id="ratio-select">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_RATIOS.map((ratio) => (
                <SelectItem key={ratio.value} value={ratio.value}>
                  <div className="flex flex-col">
                    <span>{ratio.label}</span>
                    <span className="text-xs text-muted-foreground">{ratio.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="num-images-slider">Number of Images</Label>
            <span className="font-bold text-lg">{numImages}</span>
          </div>
          <Slider
            id="num-images-slider"
            min={1}
            max={6}
            step={1}
            value={[numImages]}
            onValueChange={(value) => setNumImages(value[0])}
          />
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
      <h2 className="font-headline text-3xl mb-6">300-Word Prompts</h2>
       <div className="space-y-4">
        {isLoading &&
          Array.from({ length: numImages }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        {!isLoading && generatedPrompts.length === 0 && (
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 space-y-4 border-2 border-dashed rounded-lg">
                <Sparkles className="w-16 h-16"/>
                <h3 className="text-xl font-headline">Your 300-word prompts will appear here</h3>
                <p>Upload a product image and generate detailed 300-word prompts with "see image attached" references!</p>
            </div>
        )}
        {!isLoading &&
          generatedPrompts.map((prompt, i) => (
            <Card
              key={i}
              className="p-4 bg-white/10 dark:bg-white/10 border border-white/20 dark:border-white/20"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-sm opacity-75">
                    Prompt {i + 1} of {generatedPrompts.length}
                  </h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {prompt}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCopyPrompt(prompt, i)}
                  variant="outline"
                  className="shrink-0 bg-white/10 hover:bg-white/20 border-white/20"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
      </div>
    </GlassCard>
  );

  return (
    <div className={cn(
      "min-h-screen w-full p-4 sm:p-6 lg:p-8",
      "bg-gradient-to-br from-[#ebeff9] to-[#d6e0f5] text-slate-800",
      "dark:from-[#667eea] dark:to-[#764ba2] dark:text-white"
      )}>
      <div className="max-w-screen-2xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-headline tracking-tight">
            Product Image Promt Generator
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isCheckingApi ? (
                <Loader className="animate-spin text-muted-foreground" />
              ) : apiStatus === null ? (
                <Loader className="animate-spin text-muted-foreground" />
              ) : apiStatus.isConnected ? (
                <>
                  <CheckCircle2 className="text-green-400" />
                  <span className="text-sm text-green-400">API Connected</span>
                </>
              ) : (
                <>
                  <XCircle className="text-red-400" />
                  <span className="text-sm text-red-400">
                    API Disconnected
                    {apiStatus.message && (
                      <span className="block text-xs opacity-75">
                        {apiStatus.message}
                      </span>
                    )}
                  </span>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefreshApiStatus}
                disabled={isCheckingApi}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isCheckingApi ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className='flex items-center space-x-2'>
                <Sun className='h-5 w-5' />
                <Switch
                  checked={themeMode === 'dark'}
                  onCheckedChange={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                  aria-label="Toggle theme"
                />
                <Moon className='h-5 w-5' />
            </div>
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
