import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionPlans, useUserSubscription, useCreateCheckout } from '@/hooks/useSubscription';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Sparkles, Crown, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Pricing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isYearly, setIsYearly] = useState(false);
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: subscription } = useUserSubscription();
  const createCheckout = useCreateCheckout();

  const canceled = searchParams.get('canceled') === 'true';

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Zap className="h-5 w-5" />;
      case 'premium':
        return <Crown className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'from-blue-500 to-cyan-500';
      case 'premium':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  };

  const handleSubscribe = (plan: typeof plans extends (infer T)[] ? T : never) => {
    if (plan.tier === 'free') return;
    
    const priceId = isYearly ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;
    
    if (!priceId) {
      // For demo, we'll show that Stripe prices need to be set up
      alert('Stripe price IDs need to be configured in the database.');
      return;
    }
    
    createCheckout.mutate({ priceId });
  };

  const isCurrentPlan = (tier: string) => {
    if (!subscription?.plan) {
      return tier === 'free';
    }
    return subscription.plan.tier === tier && subscription.status === 'active';
  };

  if (plansLoading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 pb-24 lg:pb-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Unlock premium features to enhance your reading and writing experience
          </p>

          {canceled && (
            <div className="mt-4 p-3 bg-muted rounded-lg inline-block">
              <p className="text-sm text-muted-foreground">
                Checkout was canceled. Feel free to try again when you're ready.
              </p>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={cn('text-sm', !isYearly && 'font-medium')}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={cn('text-sm', isYearly && 'font-medium')}>
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 17%
              </Badge>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans?.map((plan) => {
            const price = isYearly ? plan.price_yearly : plan.price_monthly;
            const isCurrent = isCurrentPlan(plan.tier);
            const isPopular = plan.tier === 'pro';

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  isPopular && 'ring-2 ring-primary shadow-lg scale-105',
                  isCurrent && 'ring-2 ring-green-500'
                )}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute top-0 left-0">
                    <Badge className="rounded-none rounded-br-lg bg-green-500">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="pt-8">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 bg-gradient-to-br',
                    getTierColor(plan.tier)
                  )}>
                    {getTierIcon(plan.tier)}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      ${formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {!user ? (
                    <Button asChild className="w-full" variant={isPopular ? 'default' : 'outline'}>
                      <Link to="/auth">Sign Up to Subscribe</Link>
                    </Button>
                  ) : isCurrent ? (
                    <Button disabled className="w-full" variant="outline">
                      Current Plan
                    </Button>
                  ) : plan.tier === 'free' ? (
                    <Button disabled className="w-full" variant="outline">
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={createCheckout.isPending}
                      className={cn(
                        'w-full',
                        isPopular && 'btn-gradient'
                      )}
                      variant={isPopular ? 'default' : 'outline'}
                    >
                      {createCheckout.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </>
                      ) : (
                        <>Upgrade to {plan.name}</>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-display font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-1">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-1">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards through Stripe, our secure payment provider.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium mb-1">Can I switch plans?</h3>
              <p className="text-sm text-muted-foreground">
                Absolutely! You can upgrade or downgrade your plan at any time from your account settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
