import { useState, useEffect } from 'react';
import { BentoCard } from '../ui/PortfolioUI';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface CommitMonth {
  month: string;
  count: number;
}

interface LanguageStat {
  name: string;
  count: number;
  color: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',    // Vibrant Royal Blue
  JavaScript: '#F7DF1E',    // Bright JS Yellow
  Python: '#10B981',        // Vibrant Emerald Green
  HTML: '#FF5722',          // Deep Orange
  CSS: '#8B5CF6',           // Bright Violet / Purple
  Shell: '#06B6D4',         // Cyan
  Dockerfile: '#0EA5E9',    // Sky Blue
  TeX: '#EC4899',           // Pink
  'C++': '#F43F5E',         // Rose Red
  Java: '#D97706',          // Amber
  Go: '#00ADD8',            // Cyan/Blue
  Rust: '#F97316'           // Orange
};

export function GitHubActivityCard() {
  const [commits, setCommits] = useState<CommitMonth[]>([]);
  const [total, setTotal] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'languages'>('graph');
  
  // Top languages from GitHub (all active languages)
  const [languages, setLanguages] = useState<LanguageStat[]>([
    { name: 'JavaScript', count: 36, color: '#F7DF1E' },
    { name: 'TypeScript', count: 27, color: '#3178C6' },
    { name: 'Python', count: 23, color: '#10B981' },
    { name: 'HTML', count: 9, color: '#FF5722' },
    { name: 'CSS', count: 5, color: '#8B5CF6' }
  ]);
  
  // Currently Working On (Synced from Firestore or fallback to latest repo & commit)
  const [currentWork, setCurrentWork] = useState<{ title: string; desc?: string; url?: string; isCustom?: boolean }>({
    title: 'Loading recent commits...',
    desc: 'Fetching latest activity from GitHub'
  });

  // Fetch GitHub Contributions
  useEffect(() => {
    fetch('/api/github/SahanPramuditha-Dev')
      .then(res => res.text())
      .then(htmlStr => {
        const parser = new DOMParser();
        const docHtml = parser.parseFromString(htmlStr, 'text/html');
        const days = docHtml.querySelectorAll('td[data-date]');

        const now = new Date();
        const monthCounts = new Array(12).fill(0);
        const monthNames = new Array(12).fill("");
        
        for (let i = 0; i < 12; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
          monthNames[i] = d.toLocaleString('default', { month: 'short' });
        }

        let totalCount = 0;
        let recentActivity = false;
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        days.forEach(dayEl => {
          const dateStr = dayEl.getAttribute('data-date');
          if (!dateStr) return;
          const d = new Date(dateStr);

          let count = 0;
          const id = dayEl.getAttribute('id');
          if (id) {
            const toolTip = docHtml.querySelector(`tool-tip[for="${id}"]`);
            if (toolTip && toolTip.textContent && !toolTip.textContent.includes('No contributions')) {
              const match = toolTip.textContent.match(/^([\d,]+)\s+contribution/);
              if (match) {
                count = parseInt(match[1].replace(/,/g, ''), 10);
              }
            }
          }

          const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
          if (diffMonths >= 0 && diffMonths < 12) {
            monthCounts[11 - diffMonths] += count;
            totalCount += count;
          }
          
          if (d >= thirtyDaysAgo && d <= now && count > 0) {
            recentActivity = true;
          }
        });
        
        const chartData = monthCounts.map((count, i) => ({
          month: monthNames[i],
          count
        }));
        
        setCommits(chartData);
        setTotal(totalCount);
        setIsActive(recentActivity);
      })
      .catch(err => {
        console.error("GitHub fetch failed:", err);
        setCommits([
          { month: 'Nov', count: 40 }, { month: 'Dec', count: 70 }, { month: 'Jan', count: 45 },
          { month: 'Feb', count: 90 }, { month: 'Mar', count: 65 }, { month: 'Apr', count: 30 },
          { month: 'May', count: 85 }, { month: 'Jun', count: 100 }, { month: 'Jul', count: 60 },
          { month: 'Aug', count: 50 }, { month: 'Sep', count: 75 }, { month: 'Oct', count: 40 }
        ]);
        setIsActive(true);
      });
  }, []);

  // Fetch Public Repos for Top Languages and Latest Real Commit
  useEffect(() => {
    // 1. Fetch Top Languages across all public repos (up to 100)
    fetch('https://api.github.com/users/SahanPramuditha-Dev/repos?per_page=100&sort=updated')
      .then(res => {
        if (!res.ok) throw new Error('Repo fetch failed');
        return res.json();
      })
      .then((repos: Array<{ name: string; language: string | null; description?: string; html_url: string; fork: boolean; pushed_at: string }>) => {
        if (!Array.isArray(repos) || repos.length === 0) return;

        // Calculate language counts across all your non-fork repositories
        const langCounts: Record<string, number> = {};
        let totalLangRepos = 0;

        repos.forEach(repo => {
          if (!repo.fork && repo.language) {
            langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
            totalLangRepos++;
          }
        });

        if (totalLangRepos > 0) {
          const sortedLangs = Object.entries(langCounts)
            .map(([name, count]) => ({
              name,
              count: Math.round((count / totalLangRepos) * 100),
              color: LANGUAGE_COLORS[name] || '#8b949e'
            }))
            .sort((a, b) => b.count - a.count);

          setLanguages(sortedLangs);
        }

        // 2. Fetch the real latest commit from the most recently updated repository
        const latestRepo = repos.find(r => !r.fork) || repos[0];
        if (latestRepo) {
          fetch(`https://api.github.com/repos/SahanPramuditha-Dev/${latestRepo.name}/commits?per_page=1`)
            .then(res => res.json())
            .then((commitsList: Array<{ commit: { message: string; author: { date: string } }; html_url: string }>) => {
              if (Array.isArray(commitsList) && commitsList.length > 0) {
                const latest = commitsList[0];
                const cleanMessage = latest.commit.message.split('\n')[0].trim();
                
                setCurrentWork(prev => {
                  // Only set if not already overridden by Firestore
                  if (prev.isCustom) return prev;
                  return {
                    title: `${latestRepo.name}`,
                    desc: cleanMessage,
                    url: latest.html_url
                  };
                });
              }
            })
            .catch(() => {
              // Fallback to repo description if commit call limits
              setCurrentWork(prev => {
                if (prev.isCustom) return prev;
                return {
                  title: `${latestRepo.name}`,
                  desc: latestRepo.description || 'Active development',
                  url: latestRepo.html_url
                };
              });
            });
        }
      })
      .catch(() => {
        // Fallback gracefully
      });
  }, []);

  // Sync "Currently Working On" status from Firestore if custom override is saved
  useEffect(() => {
    const fetchFirestoreStatus = async () => {
      try {
        const snap = await getDoc(doc(db, 'portfolio', 'working_on'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.title && data.title.trim() !== '') {
            setCurrentWork({
              title: data.title,
              desc: data.desc || '',
              url: data.url || '',
              isCustom: true
            });
          }
        }
      } catch {
        // Ignore fallback
      }
    };
    fetchFirestoreStatus();
  }, []);

  const displayData = commits.length > 0 ? commits : [
    { month: 'Nov', count: 40 }, { month: 'Dec', count: 70 }, { month: 'Jan', count: 45 },
    { month: 'Feb', count: 90 }, { month: 'Mar', count: 65 }, { month: 'Apr', count: 30 },
    { month: 'May', count: 85 }, { month: 'Jun', count: 100 }, { month: 'Jul', count: 60 },
    { month: 'Aug', count: 50 }, { month: 'Sep', count: 75 }, { month: 'Oct', count: 40 }
  ];
  const maxCount = Math.max(...displayData.map(d => d.count), 1);

  return (
    <BentoCard className="md:col-span-2 min-h-[220px] !p-0 relative overflow-hidden group flex flex-col justify-between">
      {/* Card Header & Controls */}
      <div className="p-5 sm:p-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-20">
        <div className="flex items-center gap-3">
          <a 
            href="https://github.com/SahanPramuditha-Dev" 
            target="_blank" 
            rel="noreferrer"
            className="text-lg font-bold text-textMain flex items-center gap-2 hover:text-accent transition-colors"
          >
            <i className="fab fa-github"></i>
            <span>GitHub Activity</span>
            <i className="fas fa-external-link-alt text-[10px] text-textMuted"></i>
          </a>

          {/* Activity State Badge */}
          {isActive ? (
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active
            </span>
          ) : (
            <span className="text-[10px] font-bold text-gray-500 bg-gray-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-gray-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Synced
            </span>
          )}
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-bgMain/80 p-1 rounded-xl border border-borderSubtle text-[11px] font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'graph'
                ? 'bg-accent text-white shadow-sm'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            <i className="fas fa-chart-column text-[10px]"></i> Activity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('languages')}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'languages'
                ? 'bg-accent text-white shadow-sm'
                : 'text-textMuted hover:text-textMain'
            }`}
          >
            <i className="fas fa-code text-[10px]"></i> Languages
          </button>
        </div>
      </div>

      {/* "Currently Working On" Live Banner */}
      <div className="px-5 sm:px-6 py-2">
        <div className="flex items-center justify-between bg-card/60 border border-borderSubtle/60 rounded-xl px-3.5 py-2 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <div className="truncate">
              <span className="font-bold text-textMuted uppercase tracking-wider text-[10px] mr-2">Working On:</span>
              <span className="font-semibold text-textMain">{currentWork.title}</span>
              {currentWork.desc && (
                <span className="text-textMuted hidden sm:inline ml-1.5">({currentWork.desc})</span>
              )}
            </div>
          </div>
          {currentWork.url && (
            <a 
              href={currentWork.url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-[10px] text-accent font-bold hover:underline shrink-0 flex items-center gap-1"
            >
              <span>Commit</span> <i className="fas fa-arrow-up-right-from-square"></i>
            </a>
          )}
        </div>
      </div>

      {/* Main Tab Content Display */}
      <div className="p-5 sm:p-6 pt-1 relative z-10 flex-1 flex flex-col justify-end">
        {activeTab === 'graph' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-1.5 h-16 relative">
              {displayData.map((d, i) => {
                const h = d.count === 0 ? 2 : Math.max((d.count / maxCount) * 100, 15);
                return (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-accent/10 to-accent/30 rounded-t-sm hover:from-accent hover:to-accent transition-all cursor-pointer group/bar relative" 
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold py-1.5 px-2.5 rounded-md opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-20 shadow-lg translate-y-2 group-hover/bar:translate-y-0 before:content-[''] before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-zinc-900">
                      {d.month}: {d.count} commits
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-textMuted font-bold uppercase tracking-widest mt-1 opacity-70">
              <span>Past 12 Months</span>
              {total > 0 && <span className="text-accent">{total} total commits</span>}
              <span>Present</span>
            </div>
          </div>
        )}

        {activeTab === 'languages' && (
          <div className="space-y-3 py-1">
            {/* Multi-segmented Progress Bar */}
            <div className="h-3.5 w-full bg-bgMain rounded-full overflow-hidden flex border border-borderSubtle">
              {languages.map((lang, idx) => (
                <div
                  key={idx}
                  className="h-full transition-all duration-500 hover:opacity-80"
                  style={{ width: `${lang.count}%`, backgroundColor: lang.color }}
                  title={`${lang.name}: ${lang.count}%`}
                />
              ))}
            </div>

            {/* Language Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              {languages.map((lang, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-card/60 px-2.5 py-1.5 rounded-lg border border-borderSubtle text-xs flex-1 min-w-[120px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: lang.color }}></span>
                  <span className="font-bold text-textMain truncate">{lang.name}</span>
                  <span className="text-textMuted ml-auto font-mono text-[11px]">{lang.count}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BentoCard>
  );
}
