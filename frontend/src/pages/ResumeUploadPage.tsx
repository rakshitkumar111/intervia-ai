import React, { useState, useEffect } from 'react';
import { FileUp, FileText, CheckCircle2, Trash2, ArrowRight, Sparkles, AlertCircle, Layers, BookOpen, Briefcase } from 'lucide-react';
import { resumeApi } from '../services/resumeApi';
import { Resume } from '../types';

interface ResumeUploadPageProps {
  onNavigate: (tab: string, param?: any) => void;
}

export const ResumeUploadPage: React.FC<ResumeUploadPageProps> = ({ onNavigate }) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fetchResumes = async () => {
    try {
      const data = await resumeApi.getMyResumes();
      setResumes(data);
      if (data.length > 0 && !selectedResume) {
        setSelectedResume(data[0]);
      }
    } catch (e) {
      console.error('Failed to load resumes:', e);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      const uploaded = await resumeApi.uploadResume(file);
      setResumes((prev) => [uploaded, ...prev]);
      setSelectedResume(uploaded);
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse resume.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await resumeApi.deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
      if (selectedResume?.id === id) {
        setSelectedResume(resumes.find((r) => r.id !== id) || null);
      }
    } catch (e) {
      console.error('Failed to delete resume:', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
          <FileText className="w-7 h-7 text-purple-600" />
          <span>Resume NLP Analysis & Extraction</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Upload your CV/Resume to automatically extract technical competencies, projects, and configure a tailored interview.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Upload Dropzone & Extracted Metadata View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Dropzone & History List */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all bg-white shadow-sm flex flex-col items-center justify-center ${
              dragActive
                ? 'border-purple-500 bg-purple-50/50'
                : 'border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mb-4">
              <FileUp className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              Upload Resume (PDF, DOCX, TXT)
            </h3>
            <p className="text-xs text-slate-500 mb-5 max-w-xs">
              Drag & drop your resume file here or click below to browse from your computer.
            </p>

            <label className="cursor-pointer px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/25 transition-all">
              <span>{isUploading ? 'Parsing with NLP...' : 'Browse Files'}</span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Uploaded Resumes List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Uploaded Documents ({resumes.length})
            </h4>

            {resumes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">No resume uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResume(r)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedResume?.id === r.id
                        ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-xs'
                        : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-semibold truncate text-slate-800">{r.filename}</p>
                        <p className="text-[10px] text-slate-500">
                          {r.parsed_skills.length} skills identified
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('setup-interview', { resumeId: r.id, resume: r });
                        }}
                        title="Interview with this Resume"
                        className="p-1.5 text-purple-600 hover:text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(r.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Parsed Resume NLP Card */}
        <div className="lg:col-span-7">
          {selectedResume ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedResume.filename}</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold rounded-md">
                      NLP Parsed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Uploaded on {new Date(selectedResume.uploaded_at).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('setup-interview', { resumeId: selectedResume.id, resume: selectedResume })}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Interview with this Resume</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Extracted Skills Badges */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Extracted Technical Competencies ({selectedResume.parsed_skills.length})</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedResume.parsed_skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200/80 rounded-lg text-xs font-medium transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Extracted Projects */}
              {selectedResume.parsed_projects && selectedResume.parsed_projects.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Identified Key Projects</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedResume.parsed_projects.map((proj: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-xs font-bold text-slate-800">{proj.title || `Project #${idx + 1}`}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              {selectedResume.summary && (
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
                  <p className="text-xs font-bold text-purple-800 mb-1">AI Resume Synthesis:</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedResume.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-600">Select or upload a resume to view NLP insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
