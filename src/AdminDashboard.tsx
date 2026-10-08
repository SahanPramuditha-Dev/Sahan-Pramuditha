import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // CMS State
  const [status, setStatus] = useState('Seeking 2026 Internship');
  const [isSaving, setIsSaving] = useState(false);
  const [certsJson, setCertsJson] = useState('[\n  \n]');
  const [isSavingCerts, setIsSavingCerts] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch current status & certs from Firestore
        try {
          const statusSnap = await getDoc(doc(db, 'portfolio', 'status'));
          if (statusSnap.exists()) {
            setStatus(statusSnap.data().text);
          }
          
          const certsSnap = await getDoc(doc(db, 'portfolio', 'certificates'));
          if (certsSnap.exists() && certsSnap.data().items) {
            setCertsJson(JSON.stringify(certsSnap.data().items, null, 2));
          } else {
            // Default boilerplate if none exists
            setCertsJson(JSON.stringify([
              { id: '1', icon: "fab fa-microsoft text-blue-500", title: "Microsoft FoundryX", subtitle: "Generative AI Event Attendance", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '2', icon: "fas fa-network-wired text-cyan-500", title: "Cisco", subtitle: "Introduction to Modern AI", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '3', icon: "fas fa-leaf text-green-500", title: "MongoDB", subtitle: "Python Developer Path", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '4', icon: "fab fa-github text-gray-800 dark:text-white", title: "GitHub Actions", subtitle: "Beginner Badge", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '5', icon: "fas fa-laptop-code text-teal-500", title: "DataCamp", subtitle: "Introduction to GitHub Concepts", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '6', icon: "fas fa-laptop-code text-teal-500", title: "DataCamp", subtitle: "Intermediate Git", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '7', icon: "fas fa-network-wired text-cyan-500", title: "Cisco", subtitle: "Networking Basics", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '8', icon: "fas fa-shield-alt text-cyan-500", title: "Cisco", subtitle: "Introduction to Cybersecurity", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '9', icon: "fab fa-free-code-camp text-indigo-500", title: "freeCodeCamp", subtitle: "Scientific Computing with Python", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '10', icon: "fab fa-aws text-orange-500", title: "AWS Academy", subtitle: "AWS Cloud Foundations", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '11', icon: "fas fa-chart-bar text-yellow-500", title: "Microsoft Learn", subtitle: "Introduction to Power BI", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '12', icon: "fas fa-shield-alt text-red-500", title: "OPSWAT Academy", subtitle: "Critical Infrastructure Protection", date: "2026", proofUrl: "", verifyUrl: "" },
              { id: '13', icon: "fas fa-leaf text-green-500", title: "MongoDB", subtitle: "Core Concepts and Architecture", date: "2026", proofUrl: "", verifyUrl: "" }
            ], null, 2));
          }
        } catch (err) {
          console.error("Error fetching CMS data", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSaveStatus = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'portfolio', 'status'), { text: status });
      alert('Status updated successfully!');
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCerts = async () => {
    setIsSavingCerts(true);
    try {
      const items = JSON.parse(certsJson);
      if (!Array.isArray(items)) throw new Error("JSON must be an array");
      await setDoc(doc(db, 'portfolio', 'certificates'), { items });
      alert('Certificates updated successfully!');
    } catch (err: any) {
      alert('Error updating certificates. Check your JSON format: ' + err.message);
    } finally {
      setIsSavingCerts(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-bgMain text-textMain flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bgMain text-textMain flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-card p-8 rounded-3xl border border-borderSubtle shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center text-accent">
              <i className="fas fa-lock text-2xl"></i>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-8">Admin Login</h1>
          
          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-xl text-sm">{error}</div>}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-textMuted mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent transition-colors"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-textMuted mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-accent text-white font-bold rounded-xl py-3 mt-4 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgMain text-textMain p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-3xl border border-borderSubtle">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <i className="fas fa-hammer text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold">Portfolio CMS</h1>
              <p className="text-sm text-textMuted">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-borderSubtle/20 hover:bg-borderSubtle/40 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm"
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        {/* CMS Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Status Controller */}
          <div className="bg-card p-6 rounded-3xl border border-borderSubtle flex flex-col">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <i className="fas fa-broadcast-tower text-accent"></i> Availability Status
            </h2>
            <p className="text-sm text-textMuted mb-6">This controls the pulsing status badge on your Education card.</p>
            
            <input 
              type="text" 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent transition-colors mb-4"
              placeholder="e.g. Seeking 2026 Internship"
            />
            
            <button 
              onClick={handleSaveStatus}
              disabled={isSaving}
              className="mt-auto w-full bg-accent text-white font-bold rounded-xl py-3 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Update Status'}
            </button>
          </div>

        </div>

        {/* Certificates & Events JSON Editor */}
        <div className="mt-8 bg-card p-6 rounded-3xl border border-borderSubtle flex flex-col">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <i className="fas fa-certificate text-accent"></i> Manage Certifications
          </h2>
          <p className="text-sm text-textMuted mb-6">
            Edit the JSON array below. Make sure to provide a valid `proofUrl` (link to image) and/or `verifyUrl` (link to credential) to enable the interactive gallery modal for that certificate!
          </p>
          
          <textarea 
            value={certsJson}
            onChange={(e) => setCertsJson(e.target.value)}
            className="w-full h-96 bg-bgMain border border-borderSubtle rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-accent transition-colors mb-4 font-mono text-sm whitespace-pre"
            spellCheck="false"
          />
          
          <div className="flex justify-end">
            <button 
              onClick={handleSaveCerts}
              disabled={isSavingCerts}
              className="px-8 bg-accent text-white font-bold rounded-xl py-3 hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {isSavingCerts ? 'Saving...' : 'Save Certificates'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
