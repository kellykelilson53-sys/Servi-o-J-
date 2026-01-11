import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  toUserId: string;
  toUserName: string;
  bookingRatingField?: 'client_rating' | 'worker_rating';
  updateWorkerAggregate?: boolean;
  onReviewSubmitted?: (rating: number) => void;
}

export function ReviewDialog({ 
  open, 
  onOpenChange, 
  bookingId, 
  toUserId, 
  toUserName,
  bookingRatingField = 'client_rating',
  updateWorkerAggregate = true,
  onReviewSubmitted 
}: ReviewDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [onTime, setOnTime] = useState(true);
  const [satisfactory, setSatisfactory] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast({
        title: 'Avaliação necessária',
        description: 'Por favor selecione uma classificação.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      // Insert review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          from_user_id: user.id,
          to_user_id: toUserId,
          rating,
          comment: comment || null,
          on_time: onTime,
          satisfactory: satisfactory,
        });

      if (reviewError) throw reviewError;

      // Update booking with rating
      const bookingUpdate = { [bookingRatingField]: rating } as any;
      const { error: bookingError } = await supabase
        .from('bookings')
        .update(bookingUpdate)
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Update worker's rating (only when the client is rating a worker)
      if (updateWorkerAggregate && bookingRatingField === 'client_rating') {
        const { data: workerData } = await supabase
          .from('workers')
          .select('id, rating, review_count')
          .eq('user_id', toUserId)
          .single();

        if (workerData) {
          const newReviewCount = workerData.review_count + 1;
          const newRating = ((workerData.rating * workerData.review_count) + rating) / newReviewCount;

          await supabase
            .from('workers')
            .update({
              rating: Math.round(newRating * 10) / 10,
              review_count: newReviewCount,
            })
            .eq('id', workerData.id);
        }
      }

      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado pelo seu feedback.',
      });

      onOpenChange(false);
      onReviewSubmitted?.(rating);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a avaliação.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar {toUserName}</DialogTitle>
          <DialogDescription>
            Partilhe a sua experiência com este profissional
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Classificação</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground">
                {rating === 1 && 'Muito insatisfeito'}
                {rating === 2 && 'Insatisfeito'}
                {rating === 3 && 'Razoável'}
                {rating === 4 && 'Satisfeito'}
                {rating === 5 && 'Muito satisfeito'}
              </p>
            )}
          </div>

          {/* Quick Feedback */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="on-time">Chegou no horário combinado?</Label>
              <Switch
                id="on-time"
                checked={onTime}
                onCheckedChange={setOnTime}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="satisfactory">Serviço satisfatório?</Label>
              <Switch
                id="satisfactory"
                checked={satisfactory}
                onCheckedChange={setSatisfactory}
              />
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Conte-nos sobre a sua experiência..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="hero" 
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                A enviar...
              </>
            ) : (
              'Enviar Avaliação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
