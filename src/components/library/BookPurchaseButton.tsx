import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBookPurchaseStatus, useCreateBookCheckout } from '@/hooks/useBookPurchase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, ShoppingCart, Check, FileText, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookPurchaseButtonProps {
  bookId: string;
  price: number;
  isFree: boolean;
  isAuthor: boolean;
  hasPdf: boolean;
  authorHasStripe?: boolean;
  onReadPdf?: () => void;
  className?: string;
}

export default function BookPurchaseButton({
  bookId,
  price,
  isFree,
  isAuthor,
  hasPdf,
  authorHasStripe = true,
  onReadPdf,
  className,
}: BookPurchaseButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: purchaseStatus, isLoading: statusLoading } = useBookPurchaseStatus(bookId);
  const createCheckout = useCreateBookCheckout();

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  };

  // Author always has access
  if (isAuthor) {
    if (hasPdf && onReadPdf) {
      return (
        <Button onClick={onReadPdf} className={className}>
          <FileText className="h-4 w-4 mr-2" />
          View PDF
        </Button>
      );
    }
    return null;
  }

  // Free book - show read button
  if (isFree || price === 0) {
    if (hasPdf && onReadPdf) {
      return (
        <Button onClick={onReadPdf} className={className}>
          <FileText className="h-4 w-4 mr-2" />
          Read Free
        </Button>
      );
    }
    return (
      <Badge variant="secondary" className="text-sm px-3 py-1">
        Free
      </Badge>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Button onClick={() => navigate('/auth')} className={className}>
        <ShoppingCart className="h-4 w-4 mr-2" />
        ${formatPrice(price)} - Sign in to Buy
      </Button>
    );
  }

  // Loading purchase status
  if (statusLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  // Already purchased
  if (purchaseStatus?.hasPurchased) {
    if (hasPdf && onReadPdf) {
      return (
        <Button onClick={onReadPdf} variant="default" className={className}>
          <FileText className="h-4 w-4 mr-2" />
          Read Book
        </Button>
      );
    }
    return (
      <Button variant="outline" disabled className={cn('text-green-600', className)}>
        <Check className="h-4 w-4 mr-2" />
        Purchased
      </Button>
    );
  }

  // Purchase pending
  if (purchaseStatus?.isPending) {
    return (
      <Button disabled className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Processing...
      </Button>
    );
  }

  // Author hasn't set up Stripe
  if (!authorHasStripe) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled variant="outline" className={cn("gap-2", className)}>
              <AlertCircle className="h-4 w-4" />
              ${formatPrice(price)} - Not Available
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-center">
            <p>This book cannot be purchased yet because the author hasn't set up their payment account.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Show buy button
  return (
    <Button
      onClick={() => createCheckout.mutate({ bookId })}
      disabled={createCheckout.isPending}
      className={className}
    >
      {createCheckout.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Buy for ${formatPrice(price)}
        </>
      )}
    </Button>
  );
}
