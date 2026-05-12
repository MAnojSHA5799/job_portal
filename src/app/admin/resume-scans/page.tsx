"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  Zap,
  ChevronRight,
  Loader2,
  ExternalLink,
  X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Badge, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function AdminResumeScans() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [showPdf, setShowPdf] = useState(true);
  
  // New States for Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [scoreFilter, setScoreFilter] = useState('all'); // all, high, medium, low
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const itemsPerPage = 8;

  const fetchScans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('resume_scans')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setScans(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scan?")) return;
    
    const { error } = await supabase
      .from('resume_scans')
      .delete()
      .eq('id', id);

    if (!error) {
      setScans(scans.filter(s => s.id !== id));
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const filteredScans = scans.filter(scan => {
    const matchesSearch = scan.resume_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const score = Number(scan.ats_score);
    let matchesScore = true;
    if (scoreFilter === 'high') matchesScore = score >= 80;
    else if (scoreFilter === 'medium') matchesScore = score >= 50 && score < 80;
    else if (scoreFilter === 'low') matchesScore = score < 50;

    // Date Filtering Logic
    let matchesDate = true;
    const scanDate = new Date(scan.created_at);
    const now = new Date();
    
    if (dateFilter === 'today') {
      matchesDate = scanDate.toDateString() === now.toDateString();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesDate = scanDate >= weekAgo;
    } else if (dateFilter === 'month') {
      matchesDate = scanDate.getMonth() === now.getMonth() && scanDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesScore && matchesDate;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredScans.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentScans = filteredScans.slice(indexOfFirstItem, indexOfLastItem);

  const handleAddDummy = async () => {
    const dummyScan = {
      file_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      resume_text: "John Doe\nSoftware Engineer\nExperience: 5 years at TechCorp\nSkills: React, Node.js, TypeScript",
      ats_score: Math.floor(Math.random() * 100), // Random score for testing filters
      analysis_result: {
        overallScore: 85,
        summary: "Excellent technical foundation with strong project impact. Suggest adding more leadership keywords.",
        categories: {
          formatting: { score: 90, feedback: "Clean layout, easy to scan.", fixes: ["No changes needed"] },
          experience: { score: 80, feedback: "Great achievements listed.", fixes: ["Add percentage metrics"] },
          skills: { score: 85, feedback: "Relevant tech stack.", fixes: ["Include cloud certifications"] }
        }
      }
    };

    const { error } = await supabase.from('resume_scans').insert(dummyScan);
    if (!error) fetchScans();
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div>
           
            <p className="text-gray-500 font-medium text-sm">Monitor all AI-analyzed resumes and extracted talent data.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Date Filters */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
               {['all', 'today', 'week', 'month'].map((filter) => (
                 <button
                   key={filter}
                   onClick={() => { setDateFilter(filter); setCurrentPage(1); }}
                   className={cn(
                     "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                     dateFilter === filter 
                       ? "bg-white text-primary shadow-sm" 
                       : "text-gray-400 hover:text-gray-600"
                   )}
                 >
                   {filter}
                 </button>
               ))}
            </div>

            {/* Score Filters */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
               {['all', 'high', 'medium', 'low'].map((filter) => (
                 <button
                   key={filter}
                   onClick={() => { setScoreFilter(filter); setCurrentPage(1); }}
                   className={cn(
                     "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
                     scoreFilter === filter 
                       ? "bg-white text-gray-900 shadow-sm" 
                       : "text-gray-400 hover:text-gray-600"
                   )}
                 >
                   {filter}
                 </button>
               ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search..." 
                className="bg-white border-gray-200 pl-10 h-11 text-sm text-gray-900 rounded-xl focus:ring-primary/10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-gray-400 font-bold">Accessing the vault...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {currentScans.map((scan, i) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="bg-white border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/30 transition-all group overflow-hidden relative rounded-2xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary border border-gray-100">
                          <FileText className="h-7 w-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate max-w-[200px] md:max-w-[400px]">
                              {scan.file_url ? scan.file_url.split('/').pop() : 'Direct Text Entry'}
                            </h3>
                            <Badge className={
                              scan.ats_score >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                              scan.ats_score >= 50 ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-red-50 text-red-600 border-red-100"
                            }>
                              {scan.ats_score}% ATS
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                            <span className="flex items-center gap-1.5 uppercase tracking-widest">
                              <Calendar className="h-3.5 w-3.5" /> 
                              {new Date(scan.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} • {new Date(scan.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <span className="text-gray-200">|</span>
                            <span className="flex items-center gap-1.5 uppercase tracking-widest text-primary/60">
                              <Zap className="h-3.5 w-3.5 fill-primary/60" /> 
                              ID: {scan.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-11 w-11 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 border border-gray-100 transition-all"
                          onClick={() => handleDelete(scan.id)}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 md:flex-none h-11 px-8 rounded-xl bg-gray-900 hover:bg-primary text-white font-bold gap-2 shadow-lg shadow-gray-200 hover:shadow-primary/30 transition-all"
                          onClick={() => setSelectedScan(scan)}
                        >
                          <Eye className="h-4 w-4" /> View Data
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {filteredScans.length === 0 && (
                <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                  <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-400">No resumes found</h3>
                  <p className="text-gray-500 mt-2">Adjust your search or wait for new submissions.</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="rounded-xl border-gray-100"
                >
                  Previous
                </Button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className={cn(
                      "w-10 rounded-xl transition-all",
                      currentPage === i + 1 ? "bg-primary text-white" : "border-gray-100 text-gray-500"
                    )}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="rounded-xl border-gray-100"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resume Detail Modal */}
      <AnimatePresence>
        {selectedScan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedScan(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Modal Header */}
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-2xl font-black text-gray-900">Resume Detail</h3>
                            <Badge className="bg-primary/10 text-primary border-primary/20">{selectedScan.ats_score}% ATS Score</Badge>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Scan ID: {selectedScan.id}</p>
                    </div>
                    <Button variant="ghost" onClick={() => setSelectedScan(null)} className="h-12 w-12 rounded-xl hover:bg-gray-200">
                        <X className="h-6 w-6 text-gray-900" />
                    </Button>
                </div>
                
                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                    <div className="flex border-b border-gray-100 px-8 bg-gray-50/50">
                        <button 
                            onClick={() => setShowPdf(true)}
                            className={cn(
                                "px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2",
                                showPdf ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Original PDF
                        </button>
                        <button 
                            onClick={() => setShowPdf(false)}
                            className={cn(
                                "px-6 py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2",
                                !showPdf ? "border-primary text-primary" : "border-transparent text-gray-400 hover:text-gray-600"
                            )}
                        >
                            AI Analysis & Text
                        </button>
                    </div>

                    <div className="p-8 h-full">
                        {showPdf && selectedScan.file_url ? (
                            <div className="w-full h-[600px] rounded-2xl border border-gray-100 overflow-hidden shadow-inner bg-gray-100 flex items-center justify-center relative">
                                <iframe 
                                    src={`${selectedScan.file_url}#toolbar=0`} 
                                    className="w-full h-full border-none"
                                    title="Resume Preview"
                                />
                                <div className="absolute top-4 right-4">
                                    <Button 
                                        size="sm" 
                                        onClick={() => window.open(selectedScan.file_url, '_blank')}
                                        className="bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white shadow-xl rounded-xl font-bold"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" /> Open Full Screen
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left: Extracted Text */}
                                <div className="lg:col-span-7">
                                    <div className="flex items-center gap-2 mb-4 text-gray-900">
                                        <FileText className="h-5 w-5" />
                                        <h4 className="font-bold">Extracted Resume Text</h4>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-[500px] overflow-y-auto text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap shadow-inner">
                                        {selectedScan.resume_text || "No text extracted."}
                                    </div>
                                </div>

                                {/* Right: AI Analysis */}
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="flex items-center gap-2 mb-4 text-gray-900">
                                        <Zap className="h-5 w-5 text-primary" />
                                        <h4 className="font-bold">AI Analysis Result</h4>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {selectedScan.analysis_result?.categories && Object.entries(selectedScan.analysis_result.categories).map(([key, data]: [string, any]) => (
                                            <div key={key} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{key}</span>
                                                    <span className="text-sm font-black text-gray-900">{data.score}%</span>
                                                </div>
                                                <p className="text-xs text-gray-600 font-medium leading-normal mb-3">{data.feedback}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {data.fixes?.slice(0, 2).map((fix: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] font-bold bg-white px-2 py-1 rounded border border-gray-100 text-gray-500">• {fix}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                                        <h5 className="text-sm font-black text-primary uppercase tracking-widest mb-3">AI Summary</h5>
                                        <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                            {selectedScan.analysis_result?.summary}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {selectedScan.file_url && (
                        <Button 
                            variant="outline" 
                            className="h-12 px-6 rounded-xl font-bold gap-2"
                            onClick={() => window.open(selectedScan.file_url, '_blank')}
                        >
                            <Download className="h-4 w-4" /> Download Resume
                        </Button>
                    )}
                    <Button 
                        onClick={() => setSelectedScan(null)}
                        className="h-12 px-8 rounded-xl bg-gray-900 text-white font-bold"
                    >
                        Close Preview
                    </Button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
;
}
