import {
  Award,
  HeartPulse,
  Landmark,
  LineChart,
  Recycle,
  Scale,
  Shield,
  TrendingUp,
  GraduationCap,
  Eye,
  Compass,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/Reveal';

export interface ServiceJourneyStage {
  stage: string;
  description: string;
  icon?: string;
}

export interface ServiceJourneyConfig {
  eyebrow: string;
  title: string;
  description: string;
  stages: ServiceJourneyStage[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  HeartPulse,
  Shield,
  TrendingUp,
  Recycle,
  Award,
  Landmark,
  LineChart,
  Scale,
  GraduationCap,
  Eye,
  Compass,
  Building2,
};

/**
 * Journey section for a single service category. Renders the stage-by-stage
 * path described by the service positioning tag (e.g. Financial Health →
 * Resilience → Leadership) as a connected progression.
 */
export function ServiceJourney({ config }: { config: ServiceJourneyConfig }) {
  const { eyebrow, title, description, stages } = config;

  return (
    <section id="journey" className="scroll-mt-32 section-pad bg-bgalt">
      <div className="container-lux">
        <Reveal className="mb-12 max-w-3xl">
          <span className="eyebrow text-brand">
            <span className="divider-accent" />
            {eyebrow}
          </span>
          <h2 className="mt-2 text-h2 font-semibold text-foreground">{title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{description}</p>
        </Reveal>

        <div className="relative">
          <div
            aria-hidden
            className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-brand/40 via-brand/20 to-transparent lg:left-0 lg:top-7 lg:h-px lg:w-full lg:bg-gradient-to-r"
          />
          <ol className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-6">
            {stages.map((stage, i) => {
              const Icon = ICONS[stage.icon ?? ''] ?? TrendingUp;
              const last = i === stages.length - 1;
              return (
                <li key={stage.stage} className="relative lg:pl-0 lg:pr-4">
                  <div className="relative flex items-start gap-5 lg:flex-col lg:items-start">
                    <span
                      className={cn(
                        'relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 bg-background shadow-soft',
                        last ? 'border-brand text-brand' : 'border-growth text-growth'
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="lg:mt-6">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Stage {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3
                        className={cn(
                          'mt-1 font-display text-2xl font-semibold',
                          last ? 'text-brand' : 'text-foreground'
                        )}
                      >
                        {stage.stage}
                      </h3>
                      <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}