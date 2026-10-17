import { useState, useEffect } from 'react';
import { BentoCard } from '../ui/PortfolioUI';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { type ArticleItem, DEFAULT_ARTICLES } from '../../types/cms';

export function ArticlesCard() {
  const [articles, setArticles] = useState<ArticleItem[]>(DEFAULT_ARTICLES);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const snap = await getDoc(doc(db, 'portfolio', 'articles'));
        if (snap.exists()) {
          const data = snap.data().items as ArticleItem[];
          if (Array.isArray(data) && data.length > 0) {
            setArticles(data);
          }
        }
      } catch (err) {
        console.error('Failed to load articles for card:', err);
      }
    };
    fetchArticles();
  }, []);

  return (
    <BentoCard className="md:col-span-1 relative overflow-hidden flex flex-col justify-between min-h-[220px] group">
      <div className="absolute top-0 right-0 w-36 h-36 bg-accent/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-lg font-bold text-textMain flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <i className="fas fa-feather-pointed text-sm"></i>
          </div>
          <span>Articles & Notes</span>
        </h3>
        <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider bg-bgMain/80 px-2 py-1 rounded-full border border-borderSubtle">
          {articles.length} {articles.length === 1 ? 'Article' : 'Articles'}
        </span>
      </div>

      <div className="space-y-3 relative z-10 my-auto">
        {articles.slice(0, 2).map((item, idx) => (
          <a
            key={item.id || idx}
            href={item.url || '#'}
            target={item.url && item.url !== '#' ? '_blank' : undefined}
            rel="noreferrer"
            className="block p-3 rounded-2xl bg-bgMain/60 hover:bg-bgMain border border-borderSubtle/60 hover:border-accent/40 transition-all duration-200 group/article"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 overflow-hidden">
                <h4 className="text-xs font-bold text-textMain group-hover/article:text-accent transition-colors line-clamp-1">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-textMuted">
                  <span className="font-semibold">{item.platform || 'Article'}</span>
                  <span>•</span>
                  <span>{item.date || 'Recent'}</span>
                  <span>•</span>
                  <span>{item.readTime || '5 min read'}</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center text-textMuted group-hover/article:text-accent group-hover/article:translate-x-0.5 transition-all shrink-0 border border-borderSubtle/40">
                <i className="fas fa-arrow-up-right-from-square text-[10px]"></i>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="pt-3 border-t border-borderSubtle/40 flex items-center justify-between text-[11px] text-textMuted relative z-10">
        <span className="italic text-[10px]">Technical writing & architectural insights</span>
        <a
          href="https://medium.com"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-accent hover:underline flex items-center gap-1 text-[11px]"
        >
          Read on Medium <i className="fas fa-chevron-right text-[8px]"></i>
        </a>
      </div>
    </BentoCard>
  );
}
