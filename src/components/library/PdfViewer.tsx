import { useState, useEffect } from 'react';
import { useGetPdfAccess } from '@/hooks/useBookPurchase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, FileText, RefreshCw, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PdfViewerProps {
  bookId: string;
  bookTitle: string;
  onClose?: () => void;
}

export default function PdfViewer({ bookId, bookTitle, onClose }: PdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const getPdfAccess = useGetPdfAccess();

  useEffect(() => {
    loadPdf();
  }, [bookId]);

  const loadPdf = async () => {
    try {
      const result = await getPdfAccess.mutateAsync({ bookId });
      setPdfUrl(result.url);
    } catch (error) {
      console.error('Failed to load PDF:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (getPdfAccess.isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-muted/50 rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  if (getPdfAccess.isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-muted/50 rounded-lg">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Failed to load PDF</p>
        <Button onClick={loadPdf} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-muted/50 rounded-lg">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No PDF available</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative bg-background rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <h3 className="font-medium truncate">{bookTitle}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* PDF iframe - No download, just viewing */}
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
        className={cn(
          'w-full border-0',
          isFullscreen ? 'h-[calc(100vh-60px)]' : 'h-[600px]'
        )}
        title={bookTitle}
      />
    </div>
  );
}
