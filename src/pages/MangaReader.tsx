import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mangaService } from '../services/mangaService';
import { jikanService } from '../services/jikanService';
import { useAnimeList } from '../hooks/useAnimeList';
import { ChevronLeft, Loader2, BookOpen, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export default function MangaReader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { list, updateAnime, addAnime } = useAnimeList();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [mangaDexId, setMangaDexId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any | null>(null);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(-1);
  
  const [pages, setPages] = useState<string[]>([]);
  const [loadingChapter, setLoadingChapter] = useState(false);
  
  const [mangaTitle, setMangaTitle] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // 1. Fetch from Jikan to get exact title
        const jikanData = await jikanService.getDetails(Number(id), 'manga');
        const title = jikanData.title;
        setMangaTitle(title);
        
        // 2. Search MangaDex
        const searchRes = await mangaService.searchManga(title);
        if (searchRes && searchRes.data && searchRes.data.length > 0) {
          const mdId = searchRes.data[0].id;
          setMangaDexId(mdId);
          
          // 3. Fetch Feed
          const feedRes = await mangaService.getMangaFeed(mdId);
          if (feedRes && feedRes.data) {
            setChapters(feedRes.data);
          }
        } else {
          setError('Mangá não encontrado na base de leitura (MangaDex).');
        }
      } catch (err) {
        console.error(err);
        setError('Erro ao preparar leitura.');
      } finally {
        setLoading(false);
      }
    };
    if (id) init();
  }, [id]);

  const loadChapter = async (chapter: any, index: number) => {
    setCurrentChapterIndex(index);
    setSelectedChapter(chapter);
    setLoadingChapter(true);
    setPages([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Save locally
    if (id) {
       localStorage.setItem(`manga_last_read_${id}`, chapter.id);
    }
    
    // Optionally update user's list progress if they have it in their list
    if (id) {
      const numericId = Number(id);
      const inList = list.find(item => item.id === numericId);
      const chapterNumber = Number(chapter.attributes?.chapter) || (index + 1);
      
      if (inList) {
        // If chapter read is greater than current progress, or if they haven't started, update it
        if (!inList.progress || inList.progress < chapterNumber) {
          updateAnime(numericId, { 
            progress: chapterNumber, 
            status: inList.status === 'PLAN_TO_WATCH' ? 'READING' : inList.status 
          });
        }
      }
    }

    try {
      const pageRes = await mangaService.getChapterPages(chapter.id);
      if (pageRes && pageRes.chapter) {
        const baseUrl = pageRes.baseUrl;
        const hash = pageRes.chapter.hash;
        const images = pageRes.chapter.data.map((file: string) => `${baseUrl}/data/${hash}/${file}`);
        setPages(images);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChapter(false);
    }
  };

  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      loadChapter(chapters[currentChapterIndex + 1], currentChapterIndex + 1);
    }
  };

  const goToPrevChapter = () => {
    if (currentChapterIndex > 0) {
      loadChapter(chapters[currentChapterIndex - 1], currentChapterIndex - 1);
    }
  };

  const clearChapter = () => {
    setSelectedChapter(null);
    setCurrentChapterIndex(-1);
    setPages([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-brand animate-spin" />
        <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Buscando capítulos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 md:px-12 pb-12 max-w-5xl mx-auto">
      <button 
        onClick={() => selectedChapter ? clearChapter() : navigate(-1)}
        className="flex items-center gap-2 text-brand font-black uppercase tracking-widest text-sm mb-8 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
        {selectedChapter ? 'Voltar para Capítulos' : 'Voltar para Mangá'}
      </button>

      {error && !selectedChapter ? (
        <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-3xl text-center">
          <BookOpen className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-white uppercase">{error}</h2>
          <p className="text-gray-400 mt-2">Esse mangá pode não estar traduzido para Português no momento.</p>
        </div>
      ) : !selectedChapter ? (
        <div className="bg-[var(--color-card)] rounded-[32px] p-6 md:p-12 border border-[var(--color-border)] shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-black text-[var(--color-text-bright)] uppercase italic tracking-tighter">
              Capítulos: {mangaTitle}
            </h1>
            
            {id && localStorage.getItem(`manga_last_read_${id}`) && chapters.length > 0 && (
              <button 
                onClick={() => {
                  const lastId = localStorage.getItem(`manga_last_read_${id}`);
                  const idx = chapters.findIndex(c => c.id === lastId);
                  if (idx !== -1) loadChapter(chapters[idx], idx);
                }}
                className="bg-brand text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                Continuar Lendo
              </button>
            )}
          </div>
          
          {chapters.length === 0 ? (
            <p className="text-gray-400">Nenhum capítulo disponível em Português.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {chapters.map((cap, index) => {
                const isLastRead = id && localStorage.getItem(`manga_last_read_${id}`) === cap.id;
                return (
                  <button
                    key={cap.id}
                    onClick={() => loadChapter(cap, index)}
                    className={cn(
                      "transition-all p-4 rounded-2xl flex flex-col items-center justify-center gap-2 group border",
                      isLastRead 
                        ? "bg-brand/20 border-brand text-brand hover:bg-brand hover:text-white" 
                        : "bg-black/20 hover:bg-brand hover:text-black border-[var(--color-border)] text-gray-400"
                    )}
                  >
                    <BookOpen className={cn("w-6 h-6 transition-colors", isLastRead ? "text-brand group-hover:text-white" : "text-gray-500 group-hover:text-black")} />
                    <span className="font-black text-sm">Capítulo {cap.attributes.chapter || '?'}</span>
                    {isLastRead && <span className="text-[10px] uppercase tracking-widest">Parei Aqui</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 bg-black p-4 md:p-8 rounded-3xl border border-[var(--color-border)]">
          <div className="w-full flex justify-between items-center bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] sticky top-24 z-10 shadow-xl flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h2 className="font-black text-white uppercase text-sm flex items-center gap-2">
                 <BookOpen className="w-4 h-4 text-brand" />
                 <span className="hidden md:inline">Capítulo</span> {selectedChapter.attributes.chapter}
              </h2>
              <select 
                value={currentChapterIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  if(!isNaN(idx)) loadChapter(chapters[idx], idx);
                }}
                className="bg-black text-white border border-[var(--color-border)] rounded-lg px-2 py-1 text-xs font-black uppercase tracking-widest outline-none py-2"
              >
                {chapters.map((cap, idx) => (
                  <option key={cap.id} value={idx}>
                    Cap {cap.attributes.chapter}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-gray-400 font-bold text-xs uppercase tracking-widest hidden md:inline">{pages.length} Páginas</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={goToPrevChapter}
                  disabled={currentChapterIndex <= 0}
                  className="px-3 md:px-4 py-2 bg-zinc-800 text-white rounded-lg font-black uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-zinc-700"
                >
                  <span className="md:hidden">{'<'}</span>
                  <span className="hidden md:inline">Anterior</span>
                </button>
                <button 
                  onClick={goToNextChapter}
                  disabled={currentChapterIndex >= chapters.length - 1}
                  className="px-3 md:px-4 py-2 bg-brand text-white rounded-lg font-black uppercase text-xs tracking-widest disabled:opacity-50 hover:bg-brand-dark"
                >
                  <span className="md:hidden">{'>'}</span>
                  <span className="hidden md:inline">Próximo</span>
                </button>
              </div>
            </div>
          </div>
          
          {loadingChapter ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
               <Loader2 className="w-12 h-12 text-brand animate-spin" />
               <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Carregando páginas...</p>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              {pages.map((url, i) => (
                <img 
                  key={i} 
                  src={url} 
                  alt={`Pagina ${i+1}`} 
                  loading="lazy" 
                  className="w-full h-auto rounded-xl shadow-xl bg-zinc-900 min-h-[50vh]" 
                />
              ))}

              {/* Navigation Controls */}
              <div className="w-full flex justify-between gap-4 mt-8 bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)] shadow-xl">
                <button 
                  onClick={goToPrevChapter}
                  disabled={currentChapterIndex <= 0}
                  className="flex-1 py-3 px-6 rounded-xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-800 text-white hover:bg-zinc-700"
                >
                  Anterior
                </button>
                <button 
                  onClick={goToNextChapter}
                  disabled={currentChapterIndex >= chapters.length - 1}
                  className="flex-1 py-3 px-6 rounded-xl font-black uppercase tracking-widest text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
