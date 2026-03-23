import { useRef, useCallback } from 'react';
import { departments } from '../../shared/catalog';
import { WebsiteHeader } from '../components/WebsiteHeader';

interface HomePageProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
  onTogglePanel?: () => void;
  cartItemCount?: number;
}

export function HomePage({ onNavigate, onTogglePanel, cartItemCount = 0 }: HomePageProps) {
  const hoverStartTimeRef = useRef<{ [key: string]: number }>({});

  const handleDepartmentHover = useCallback((departmentId: string) => {
    hoverStartTimeRef.current[departmentId] = Date.now();
  }, []);

  const handleDepartmentLeave = useCallback((departmentId: string) => {
    delete hoverStartTimeRef.current[departmentId];
  }, []);

  const handleDepartmentClick = (departmentId: string) => {
    onNavigate('collection', { department: departmentId });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      <WebsiteHeader onNavigate={onNavigate} onTogglePanel={onTogglePanel} cartItemCount={cartItemCount} />

      {/* Departments Grid - Large Cards */}
      <section className="pb-8 px-6" style={{ paddingTop: '80px' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="group cursor-pointer overflow-hidden rounded-2xl relative"
                style={{ backgroundColor: '#f0f0ee' }}
                onClick={() => handleDepartmentClick(dept.id)}
                onMouseEnter={() => handleDepartmentHover(dept.id)}
                onMouseLeave={() => handleDepartmentLeave(dept.id)}
              >
                {/* Image with overlay */}
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={dept.image}
                    alt={dept.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0) 100%)'
                    }}
                  />

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-xl font-medium text-white mb-0.5">
                      {dept.name}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {dept.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-10 px-6 border-t" style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-medium mb-1 text-sm" style={{ color: '#1A1A1A' }}>
                Free Shipping
              </p>
              <p className="text-xs" style={{ color: '#a1a1a0' }}>
                On orders over €100
              </p>
            </div>
            <div>
              <p className="font-medium mb-1 text-sm" style={{ color: '#1A1A1A' }}>
                Lifetime Guarantee
              </p>
              <p className="text-xs" style={{ color: '#a1a1a0' }}>
                Quality you can trust
              </p>
            </div>
            <div>
              <p className="font-medium mb-1 text-sm" style={{ color: '#1A1A1A' }}>
                Easy Returns
              </p>
              <p className="text-xs" style={{ color: '#a1a1a0' }}>
                30-day return policy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 border-t" style={{ borderColor: '#e9eae6', backgroundColor: '#ffffff' }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs" style={{ color: '#a1a1a0' }}>
            © 2024 Demo Store — Fin conversational commerce prototype.
          </p>
        </div>
      </footer>
    </div>
  );
}
