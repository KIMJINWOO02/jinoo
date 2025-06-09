import ImageGenerator from '@/app/components/ImageGenerator';

export const metadata = {
  title: 'AI 이미지 생성기',
  description: 'AI를 사용하여 이미지를 생성해보세요.',
};

export default function ImageGeneratorPage() {
  return (
    <main className="container py-8">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <ImageGenerator />
      </div>
    </main>
  );
}
