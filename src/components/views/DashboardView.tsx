import React from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import {
  FileText,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { activeNovel, chapters, setActiveTab, selectChapter } = useNovelStore();

  if (!activeNovel) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500">
        请先选择或创建小说项目
      </div>
    );
  }

  const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);
  const avgWords = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-900/40 select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold">
                {activeNovel.genre_profile}
              </span>
              <span className="text-xs text-slate-400">
                创建于 {new Date(activeNovel.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-100 tracking-tight mb-2">
              《{activeNovel.title}》
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {activeNovel.description || '暂无作品简介。可在作品设置中随时补充世界观背景与核心大纲。'}
            </p>
          </div>

          <button
            onClick={() => {
              if (chapters.length > 0) selectChapter(chapters[0]);
              setActiveTab('EDITOR');
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <span>进入正文创作</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">总创作字数</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {totalWords.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-normal">字</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              平均每章约 {avgWords.toLocaleString()} 字
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">连载章节数</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 font-mono">
              {chapters.length} <span className="text-xs font-sans text-slate-500 font-normal">章</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              已完成持久化存盘
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">文风与语言</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-semibold text-slate-200 truncate">
              {activeNovel.writing_style}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              设定为简体中文 (zh-CN)
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setActiveTab('CHARACTERS')}
            className="p-5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">人物档案库</h3>
                <p className="text-xs text-slate-500">管理主角、配角与反派的性格、秘密与成长轨迹</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('WORLD')}
            className="p-5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">世界观设定 (Canon)</h3>
                <p className="text-xs text-slate-500">构建战力法则、势力门派、地理体系与权威规则</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Chapters Preview */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              最近章节列表
            </h3>
            <span className="text-xs text-slate-500">
              共 {chapters.length} 章
            </span>
          </div>

          {chapters.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">暂无章节，请点击左侧栏新建章节开始创作</p>
          ) : (
            <div className="space-y-2">
              {chapters.slice(0, 5).map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    selectChapter(ch);
                    setActiveTab('EDITOR');
                  }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/60 cursor-pointer transition text-xs border border-slate-800/80"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-slate-200">
                      第 {ch.chapter_number} 章
                    </span>
                    <span className="text-slate-400">{ch.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500">
                    <span>{ch.word_count || 0} 字</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
