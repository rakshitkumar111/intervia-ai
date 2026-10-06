import React, { useState } from 'react';
import { User, Mail, Briefcase, Award, Code, Save, CheckCircle2, Globe, Link2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [targetRole, setTargetRole] = useState(user?.profile?.target_role || 'Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState(user?.profile?.experience_level || 'Fresher (0-1 yrs)');
  const [skillsText, setSkillsText] = useState((user?.profile?.skills || []).join(', '));
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [githubUrl, setGithubUrl] = useState(user?.profile?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.profile?.linkedin_url || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const skillsArray = skillsText
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    try {
      await updateProfile({
        target_role: targetRole,
        experience_level: experienceLevel,
        skills: skillsArray,
        bio,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to update profile:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 flex items-center gap-2.5">
          <User className="w-7 h-7 text-brand-400" />
          <span>Candidate Profile & Preferences</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Update your target roles, competency areas, and career background.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* User Account Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-800">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
            <input
              type="text"
              disabled
              value={user?.full_name || ''}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Target Role & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-brand-400" />
              <span>Target Role</span>
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Experience Level</span>
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            >
              <option value="Fresher (0-1 yrs)">Fresher (0-1 yrs)</option>
              <option value="Mid-Level (2-4 yrs)">Mid-Level (2-4 yrs)</option>
              <option value="Senior (5+ yrs)">Senior (5+ yrs)</option>
            </select>
          </div>
        </div>

        {/* Skills Tag Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-purple-400" />
            <span>Key Technical Skills (Comma-separated)</span>
          </label>
          <input
            type="text"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="Python, FastAPI, React, SQL, Machine Learning, Docker"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Professional Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a brief overview of your academic focus and technical interests..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500 resize-none"
          />
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-400" />
              <span>GitHub / Portfolio URL</span>
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-blue-400" />
              <span>LinkedIn Profile URL</span>
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {saved && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/25 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
