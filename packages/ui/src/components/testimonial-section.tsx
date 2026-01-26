import React from 'react';
import { Container, Section } from './layout-foundation';
import { Star } from 'lucide-react';

const REVIEWS = [
  {
    name: "Dr. S. K. Singh",
    role: "Principal, The Heritage School",
    quote: "The multi-language support allowed our staff to transition seamlessly. Fee collection efficiency has increased by 40% in just one term.",
    rating: 5
  },
  {
    name: "Mrs. Anjali Rao",
    role: "Admin Director, Vikas International",
    quote: "Finally, an ERP that doesn't feel like it's from the 90s. The UI is clean, and the manual policy locks have eliminated our audit errors.",
    rating: 5
  },
  {
    name: "Mr. Rajive Gupta",
    role: "Founder, Green Valley Group",
    quote: "The ability to manage multiple branches from a single dashboard has been a game changer for our expansion strategy.",
    rating: 5
  }
];

export const TestimonialSection = () => {
  return (
    <Section className="bg-background">
      <Container>
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by educational leaders
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how schools across the country are transforming their operations.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {REVIEWS.map((review, i) => (
            <div key={i} className="flex flex-col rounded-2xl border bg-card p-8 shadow-sm">
              <div className="flex gap-0.5 text-yellow-500">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-6 flex-grow text-lg italic text-foreground">
                "{review.quote}"
              </p>
              <div className="mt-8 flex items-center gap-4 border-t pt-8">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {review.name[0]}
                </div>
                <div className="text-left">
                  <p className="font-bold text-foreground">{review.name}</p>
                  <p className="text-sm text-muted-foreground">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
};
