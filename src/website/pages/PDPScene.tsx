import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Truck, Shield, RotateCcw, Star, Heart, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { WebsiteHeader } from '../components/WebsiteHeader';
import { getProductById, getProductsByDepartment, getDepartmentById } from '../../shared/catalog';
import { enrichmentData, departmentFallbackAccordions, type Enrichment } from '../data/pdp-enrichment';

interface PDPSceneProps {
  productId?: string;
  onNavigate?: (page: string, params?: Record<string, string>) => void;
  onTogglePanel?: () => void;
  onAddToCart?: (productId: string, quantity: number, size?: string, color?: string) => void;
  cartItemCount?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PDPScene({ productId, onNavigate, onTogglePanel, onAddToCart, cartItemCount = 0 }: PDPSceneProps) {
  const product = useMemo(() => getProductById(productId || 'prod-001'), [productId]);

  // Enrichment: product-specific first, then department fallback
  const enrichment: Enrichment | null = useMemo(() => {
    if (!product) return null;
    if (enrichmentData[product.id]) return enrichmentData[product.id];
    const dept = product.department || '';
    if (departmentFallbackAccordions[dept]) return { accordions: departmentFallbackAccordions[dept] };
    return null;
  }, [product]);

  // Recommended products from same department
  const recommended = useMemo(() => {
    if (!product?.department) return [];
    return getProductsByDepartment(product.department)
      .filter(p => p.id !== product.id)
      .slice(0, 5);
  }, [product]);

  // Department for breadcrumb
  const department = useMemo(() => product?.department ? getDepartmentById(product.department) : null, [product]);

  const images = product?.images || (product ? [product.image] : []);
  const hasColors = product?.colors && product.colors.length > 0;
  const hasSizes = product?.sizes && product.sizes.length > 0;
  const hasVariants = product?.variants && product.variants.length > 0;

  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0]?.value || '');
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]?.value || '');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [openAccordion, setOpenAccordion] = useState<string>('');
  const [fullscreenImage, setFullscreenImage] = useState<{ index: number } | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());
  const [reviewsCarouselApi, setReviewsCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  // Reset selections when product changes
  useEffect(() => {
    setSelectedSize(product?.sizes?.[0]?.value || '');
    setSelectedColor(product?.colors?.[0]?.value || '');
    setSelectedVariants({});
    setAddedToCart(false);
    setOpenAccordion('');
    setFullscreenImage(null);
  }, [product?.id]);

  // Price logic — sizes with per-size pricing, or flat price
  const currentSize = product?.sizes?.find(s => s.value === selectedSize);
  const currentPrice = currentSize?.price || product?.price || 0;
  const currentOriginalPrice = currentSize?.originalPrice || product?.originalPrice;
  const currentDiscount = currentSize?.discount || product?.discount;

  // Currency symbol
  const currencySymbol = product?.currency === 'EUR' ? '€' : '$';

  // Reviews carousel sync
  useEffect(() => {
    if (!reviewsCarouselApi) return;
    const onSelect = () => {
      setCanScrollPrev(reviewsCarouselApi.canScrollPrev());
      setCanScrollNext(reviewsCarouselApi.canScrollNext());
    };
    setCanScrollPrev(reviewsCarouselApi.canScrollPrev());
    setCanScrollNext(reviewsCarouselApi.canScrollNext());
    reviewsCarouselApi.on('select', onSelect);
    reviewsCarouselApi.on('reInit', onSelect);
    return () => {
      reviewsCarouselApi.off('select', onSelect);
      reviewsCarouselApi.off('reInit', onSelect);
    };
  }, [reviewsCarouselApi]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    onAddToCart?.(product.id, 1, selectedSize, selectedColor);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [onAddToCart, product, selectedSize, selectedColor]);

  // Fullscreen image navigation
  const handleOpenFullscreen = (index: number) => setFullscreenImage({ index });
  const handleCloseFullscreen = () => setFullscreenImage(null);
  const handleNextImage = () => {
    if (fullscreenImage) {
      setFullscreenImage({ index: (fullscreenImage.index + 1) % images.length });
    }
  };
  const handlePrevImage = () => {
    if (fullscreenImage) {
      setFullscreenImage({ index: (fullscreenImage.index - 1 + images.length) % images.length });
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
        <WebsiteHeader onNavigate={(p, params) => onNavigate?.(p, params)} onTogglePanel={onTogglePanel} cartItemCount={cartItemCount} />
        <div className="flex items-center justify-center" style={{ paddingTop: '112px' }}>
          <p style={{ color: '#646462' }}>Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      <WebsiteHeader onNavigate={(p, params) => onNavigate?.(p, params)} onTogglePanel={onTogglePanel} cartItemCount={cartItemCount}>
        {/* Breadcrumb */}
        <div className="border-b" style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}>
          <div className="max-w-6xl mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-sm">
              <button onClick={() => onNavigate?.('home')} className="hover:underline" style={{ color: '#646462' }}>Home</button>
              <ChevronRight className="h-3 w-3" style={{ color: '#646462' }} />
              {department && (
                <>
                  <button onClick={() => onNavigate?.('collection', { department: department.id })} className="hover:underline" style={{ color: '#646462' }}>
                    {department.name}
                  </button>
                  <ChevronRight className="h-3 w-3" style={{ color: '#646462' }} />
                </>
              )}
              <span style={{ color: '#1A1A1A' }}>{product.name}</span>
            </div>
          </div>
        </div>
      </WebsiteHeader>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-6xl mx-auto px-6 pb-6" style={{ paddingTop: '112px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,440px] gap-6">

          {/* LEFT COLUMN - Image Gallery */}
          <div className="space-y-2">
            {/* Hero image */}
            <div
              className="aspect-[4/3] bg-muted rounded-2xl overflow-hidden cursor-pointer"
              onClick={() => handleOpenFullscreen(0)}
            >
              <img src={images[0]} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
            </div>

            {/* Additional images in rows */}
            {images.length > 1 && (
              <div className={`grid gap-2 ${images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {images.slice(1, 4).map((img, idx) => (
                  <div key={idx} className="aspect-square bg-muted rounded-2xl overflow-hidden cursor-pointer" onClick={() => handleOpenFullscreen(idx + 1)}>
                    <img src={img} alt={`${product.name} view ${idx + 2}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            )}

            {/* More images if available (4+) */}
            {images.length > 4 && (
              <div className="aspect-[4/3] bg-muted rounded-2xl overflow-hidden cursor-pointer" onClick={() => handleOpenFullscreen(4)}>
                <img src={images[4]} alt={`${product.name} detail`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            )}
            {images.length > 5 && (
              <div className="grid grid-cols-2 gap-2">
                {images.slice(5, 7).map((img, idx) => (
                  <div key={idx} className="aspect-square bg-muted rounded-2xl overflow-hidden cursor-pointer" onClick={() => handleOpenFullscreen(idx + 5)}>
                    <img src={img} alt={`${product.name} view ${idx + 6}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Product Info */}
          <div className="lg:sticky lg:top-28 lg:self-start space-y-5">
            {/* Badge + Wishlist */}
            <div className="flex items-center justify-between">
              {product.tags && product.tags.length > 0 && (
                <Badge variant="secondary" className="capitalize">{product.tags[0]}</Badge>
              )}
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Title + Subtitle + Price */}
            <div className="space-y-2">
              <h1 className="text-xl font-semibold">{product.name}</h1>
              {product.subtitle && <p className="text-sm text-muted-foreground">{product.subtitle}</p>}
              <div className="flex items-center gap-3">
                {currentOriginalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {currencySymbol}{currentOriginalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-xl font-semibold">{currencySymbol}{currentPrice.toFixed(2)}</span>
                {currentDiscount && (
                  <Badge variant="destructive" className="text-xs">-{currentDiscount}%</Badge>
                )}
              </div>
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`h-4 w-4 ${star <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{product.rating} ({product.reviewCount} reviews)</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Model info (activewear) */}
            {enrichment?.modelInfo && (
              <p className="text-xs text-muted-foreground">{enrichment.modelInfo}</p>
            )}

            {/* Color Selection (rich — with hex swatches) */}
            {hasColors && (
              <div className="border rounded-3xl p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Color: {product.colors!.find(c => c.value === selectedColor)?.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors!.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color.value
                          ? 'border-foreground ring-2 ring-offset-2 ring-foreground'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection (rich — with per-size pricing) */}
            {hasSizes && (
              <div>
                <label className="text-sm mb-2 block">Select size</label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="w-full rounded-full">
                    <SelectValue placeholder="SELECT YOUR SIZE" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes!.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label} — {currencySymbol}{size.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Simple variants (for activewear/footwear — no hex, no pricing) */}
            {!hasColors && !hasSizes && hasVariants && (
              <div className="space-y-3">
                {product.variants!.map(variant => (
                  <div key={variant.type}>
                    <label className="text-sm mb-2 block capitalize">{variant.type}</label>
                    <Select
                      value={selectedVariants[variant.type] || variant.options[0]}
                      onValueChange={(v) => setSelectedVariants(prev => ({ ...prev, [variant.type]: v }))}
                    >
                      <SelectTrigger className="w-full rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {variant.options.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            {/* Add to Cart */}
            <div className="space-y-2">
              <Button
                className={`w-full rounded-full transition-all duration-300 ${addedToCart ? 'bg-green-600 hover:bg-green-600' : ''}`}
                onClick={handleAddToCart}
              >
                {addedToCart ? (
                  <><Check className="h-4 w-4 mr-2" /> ADDED TO CART</>
                ) : (
                  'ADD TO CART'
                )}
              </Button>
            </div>

            {/* Feature Highlights — universal */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted rounded-2xl p-3 text-center">
                <Truck className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium leading-tight">Delivery</p>
                <p className="text-xs text-muted-foreground mt-0.5">Free over {currencySymbol}100</p>
              </div>
              <div className="bg-muted rounded-2xl p-3 text-center">
                <Shield className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium leading-tight">Guarantee</p>
                <p className="text-xs text-muted-foreground mt-0.5">Quality assured</p>
              </div>
              <div className="bg-muted rounded-2xl p-3 text-center">
                <RotateCcw className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium leading-tight">Returns</p>
                <p className="text-xs text-muted-foreground mt-0.5">30-day policy</p>
              </div>
            </div>

            <Separator />

            {/* Accordion sections — content depth varies by category */}
            {enrichment && enrichment.accordions.length > 0 && (
              <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                {enrichment.accordions.map(section => (
                  <AccordionItem key={section.value} value={section.value}>
                    <AccordionTrigger className="text-sm">{section.title}</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm text-muted-foreground [&_ul]:list-disc [&_ul]:pl-4 [&_table]:w-full [&_td]:py-1" dangerouslySetInnerHTML={{ __html: section.html }} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </div>

        {/* Editorial / Story Sections — full width below the fold */}
        {enrichment?.editorialSections && enrichment.editorialSections.length > 0 && (
          <div className="mt-12 space-y-8">
            {enrichment.editorialSections.map((section, idx) => (
              <div key={idx} className="border-t pt-8" style={{ borderColor: '#e9eae6' }}>
                {section.title && (
                  <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
                )}
                <div
                  className="text-muted-foreground max-w-3xl"
                  dangerouslySetInnerHTML={{ __html: section.html }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Reviews Section — shown when enrichment includes reviews */}
        {enrichment?.reviews && enrichment.reviews.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Customer Reviews ({enrichment.reviews.length})</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => reviewsCarouselApi?.scrollPrev()} disabled={!canScrollPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => reviewsCarouselApi?.scrollNext()} disabled={!canScrollNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="py-1">
              <Carousel opts={{ align: 'start', loop: false }} setApi={setReviewsCarouselApi} className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
                  {enrichment.reviews.map(review => {
                    const isExpanded = expandedReviews.has(review.id);
                    const shouldTruncate = review.content.length > 120;
                    const displayContent = shouldTruncate && !isExpanded ? review.content.slice(0, 120) + '...' : review.content;
                    return (
                      <CarouselItem key={review.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                        <Card className="h-full">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <Avatar><AvatarFallback>{review.author.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                              <div>
                                <p className="font-medium text-sm">{review.author}</p>
                                <p className="text-xs text-muted-foreground">{review.date}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex mb-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                              ))}
                            </div>
                            <p className="font-medium text-sm mb-1">{review.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {displayContent}
                              {shouldTruncate && !isExpanded && (
                                <button onClick={() => setExpandedReviews(prev => new Set(prev).add(review.id))} className="text-foreground font-medium ml-1 hover:underline">Read more</button>
                              )}
                            </p>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        )}

        {/* Recommended Products — from same department */}
        {recommended.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold mb-4">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recommended.map(rec => (
                <Card
                  key={rec.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden rounded-2xl"
                  onClick={() => onNavigate?.('product', { productId: rec.id })}
                >
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img src={rec.image} alt={rec.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-2 mb-1">{rec.name}</p>
                    <div className="flex items-center gap-2">
                      {rec.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">{currencySymbol}{rec.originalPrice}</span>
                      )}
                      <span className="text-sm font-semibold">{currencySymbol}{rec.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen Image Modal */}
      <Dialog open={fullscreenImage !== null} onOpenChange={(open) => !open && handleCloseFullscreen()}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-white border-none [&>button]:hidden">
          <DialogTitle className="sr-only">{product.name} - Image {fullscreenImage ? fullscreenImage.index + 1 : 1} of {images.length}</DialogTitle>
          <DialogDescription className="sr-only">Product image gallery viewer.</DialogDescription>
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 z-10" onClick={handleCloseFullscreen}><X className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-10" onClick={handlePrevImage}><ChevronLeft className="h-8 w-8" /></Button>
            {fullscreenImage && <img src={images[fullscreenImage.index]} alt={`${product.name} - fullscreen`} className="max-w-full max-h-[80vh] object-contain" />}
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-10" onClick={handleNextImage}><ChevronRight className="h-8 w-8" /></Button>
            {fullscreenImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-muted-foreground text-sm bg-muted px-3 py-1 rounded-full">
                {fullscreenImage.index + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
