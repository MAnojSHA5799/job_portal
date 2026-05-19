const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(user)/ats-score/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const targetStart = '        ) : (\n          <motion.div \n            initial={{ opacity: 0 }}\n            animate={{ opacity: 1 }}\n            className="space-y-12"';
const targetEnd = '      </AnimatePresence>\n    </div>\n  </div>\n  );\n}\n';

const startIndex = content.indexOf(targetStart);
const endIndex = content.lastIndexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find target boundaries');
  process.exit(1);
}

const newContent = `        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left Column: Score & Categories */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="p-8 border-gray-100 shadow-xl rounded-[32px] bg-white text-center">
                <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Your Score</h3>
                <div className="relative w-40 h-40 mx-auto mb-8 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    {/* Background Circle */}
                    <circle cx="80" cy="80" r="70" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                    {/* Progress Circle (half circle styling if needed, but standard circle is great) */}
                    <circle 
                      cx="80" cy="80" r="70" stroke="#4f46e5" strokeWidth="12" fill="transparent" 
                      strokeDasharray={440}
                      strokeDashoffset={440 - (440 * (analysis?.overallScore || 69)) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">{analysis?.overallScore || 69}/100</span>
                    <span className="text-[10px] font-black text-gray-500 mt-1">{100 - (analysis?.overallScore || 69) > 0 ? \`\${Math.ceil((100 - (analysis?.overallScore || 69)) / 5)} Issues\` : 'No Issues'}</span>
                  </div>
                </div>

                <div className="space-y-4 text-left">
                  {/* CONTENT CATEGORY */}
                  <div className="border-b border-gray-100 pb-2">
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'content' ? null : 'content')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-400 uppercase">CONTENT</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-bold">{analysis?.categories?.formatting?.score || 65}%</Badge>
                        {expandedCategory === 'content' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    
                    {expandedCategory === 'content' && (
                      <div className="py-2 space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-semibold text-gray-600">
                            <AlertCircle className="w-4 h-4 text-amber-500" /><span>ATS Parse Rate</span>
                          </div>
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 font-bold text-[10px]">1 issue</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-semibold text-gray-600">
                            <AlertCircle className="w-4 h-4 text-red-500" /><span>Quantifying Impact</span>
                          </div>
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 font-bold text-[10px]">3 issues</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-semibold text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Repetition</span>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[10px]">No issues</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 font-semibold text-gray-600">
                            <AlertCircle className="w-4 h-4 text-red-500" /><span>Spelling & Grammar</span>
                          </div>
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 font-bold text-[10px]">1 issue</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTIONS CATEGORY */}
                  <div className="border-b border-gray-100 pb-2">
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'sections' ? null : 'sections')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-400 uppercase">SECTIONS</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-bold">{analysis?.categories?.experience?.score || 81}%</Badge>
                        {expandedCategory === 'sections' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'sections' && (
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed py-2">
                        {analysis?.categories?.experience?.feedback || "Your resume sections are well-defined, but could have stronger headings."}
                      </p>
                    )}
                  </div>

                  {/* ATS ESSENTIALS */}
                  <div className="border-b border-gray-100 pb-2">
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'essentials' ? null : 'essentials')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-400 uppercase">ATS ESSENTIALS</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold">{analysis?.categories?.skills?.score || 83}%</Badge>
                        {expandedCategory === 'essentials' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'essentials' && (
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed py-2">
                        {analysis?.categories?.skills?.feedback || "Check keywords, file formats and structure for perfect parse rate."}
                      </p>
                    )}
                  </div>

                  {/* TAILORING */}
                  <div className="pb-2">
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'tailoring' ? null : 'tailoring')}
                      className="w-full flex items-center justify-between py-2 font-bold text-gray-700 hover:text-indigo-600 transition-all"
                    >
                      <span className="text-xs font-black tracking-widest text-gray-400 uppercase">TAILORING</span>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-gray-100 text-gray-600 font-bold">??%</Badge>
                        {expandedCategory === 'tailoring' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </button>
                    {expandedCategory === 'tailoring' && (
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed py-2">
                        Match your resume specifically against a targeted job description to see tailoring score.
                      </p>
                    )}
                  </div>
                </div>

                <Button className="w-full h-12 mt-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-100 border-0">
                  Unlock Full Report <span className="ml-1 text-lg">🚀</span>
                </Button>
                
                <Button variant="ghost" onClick={reset} className="w-full mt-4 text-gray-400 hover:text-gray-600 font-bold text-xs uppercase tracking-widest">
                  <RefreshCcw className="w-3 h-3 mr-2" /> Scan Another Resume
                </Button>
              </Card>
            </div>

            {/* Right Column: Resume Switcher */}
            <div className="lg:col-span-8">
              <Card className="p-6 md:p-10 border-gray-100 shadow-xl rounded-[32px] bg-white relative overflow-hidden">
                <div className="text-center mb-8">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                    Build an ATS-friendly resume using Enhancv's resume templates.
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-2 font-bold text-gray-700">
                    <FileText className="w-5 h-5" /> Your Resume
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setActiveTab('original')}
                      className={\`px-6 py-2 text-sm font-bold rounded-lg transition-all \${activeTab === 'original' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                    >
                      Original
                    </button>
                    <button 
                      onClick={() => setActiveTab('enhancv')}
                      className={\`px-6 py-2 text-sm font-bold rounded-lg transition-all \${activeTab === 'enhancv' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                    >
                      Enhancv
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 sm:p-8 rounded-3xl border border-gray-100 relative min-h-[800px]">
                  {/* Dynamic Resume Data Setup */}
                  {(() => {
                    const defaultResumeData = {
                      name: "ABHISHEK KUMAR",
                      title: "Mechanical Engineer",
                      contact: {
                        phone: "+91-8002888028, 7079537636",
                        email: "abhishekmishra1160@gmail.com",
                        location: "Basantpur, Siwan, Bihar"
                      },
                      summary: "My objective to make value addition to the system of which I am part & my self-continuous process. I always monitor myself with an unbiased perspective with a view to recognize my liabilities & constantly strive to convert them to achieve the organization's goals.",
                      strengths: [
                        { name: "Interpersonal Skills", desc: "Team - Building and Team Leadership skills, Excellent communication and interpersonal skills" }
                      ],
                      achievements: [
                        { title: "Process Improvement Achievements", desc: "Successfully improved production processes leading to enhanced efficiency and reduced waste in manufacturing" }
                      ],
                      interests: [
                        { name: "Hobbies & Interests", desc: "Enjoys listening to music, reading, and engaging in warm-up exercises" }
                      ],
                      languages: [
                        { name: "English", level: 4, label: "Proficient" },
                        { name: "Hindi", level: 5, label: "Native" }
                      ],
                      experience: [
                        {
                          role: "Production Engineer (assembly line)",
                          company: "SAN Automotive Industries Pvt Ltd",
                          dates: "06/2022 - Present",
                          location: "Faridabad, Haryana",
                          bulletPoints: [
                            "Day to day production planning",
                            "Manpower handling",
                            "Product & Process audit in-house",
                            "Rejection Monitoring",
                            "Layout inspection",
                            "Responsible for process improvement",
                            "Responsible for assembly line production"
                          ]
                        },
                        {
                          role: "Production Engineer (assembly line)",
                          company: "Saket Fabs Pvt Ltd",
                          dates: "09/2021 - 04/2022",
                          location: "Prithla, Palwal, Haryana",
                          bulletPoints: [
                            "Manufacturing and assembly of products",
                            "Responsible for assembly line production as Production Engineer",
                            "Ensured timely delivery of products"
                          ]
                        },
                        {
                          role: "Production Engineer (assembly line)",
                          company: "Hema Engineering Industries Ltd",
                          dates: "04/2018 - 08/2021",
                          location: "Bawal, Haryana",
                          bulletPoints: [
                            "Manufacturing company specializing in engineering solutions",
                            "Worked as Production Engineer on assembly line",
                            "Ensured quality and efficiency in production"
                          ]
                        }
                      ],
                      education: [
                        {
                          degree: "B.Tech. in Mechanical Engineering",
                          school: "Siwan Engineering & Technical Institute",
                          dates: "08/2013 - 05/2017",
                          location: "Siwan, Bihar"
                        },
                        {
                          degree: "12th Grade",
                          school: "BSEB",
                          dates: "06/2009 - 05/2011",
                          location: "Patna"
                        },
                        {
                          degree: "10th Grade",
                          school: "BSEB",
                          dates: "06/2007 - 05/2009",
                          location: "Patna"
                        }
                      ],
                      skills: ["Gmail", "IAM", "Microsoft Word", "Microsoft Excel", "Kaizen"]
                    };

                    const resume = {
                      name: analysis?.parsedResume?.name || (file?.name ? file.name.split('.')[0] : defaultResumeData.name),
                      title: analysis?.parsedResume?.title || defaultResumeData.title,
                      contact: {
                        phone: analysis?.parsedResume?.contact?.phone || defaultResumeData.contact.phone,
                        email: analysis?.parsedResume?.contact?.email || defaultResumeData.contact.email,
                        location: analysis?.parsedResume?.contact?.location || defaultResumeData.contact.location,
                      },
                      summary: analysis?.parsedResume?.summary || defaultResumeData.summary,
                      experience: analysis?.parsedResume?.experience?.length ? analysis?.parsedResume?.experience : defaultResumeData.experience,
                      education: analysis?.parsedResume?.education?.length ? analysis?.parsedResume?.education : defaultResumeData.education,
                      skills: analysis?.parsedResume?.skills?.length ? analysis?.parsedResume?.skills : defaultResumeData.skills,
                      strengths: defaultResumeData.strengths,
                      achievements: defaultResumeData.achievements,
                      interests: defaultResumeData.interests,
                      languages: defaultResumeData.languages
                    };

                    const getInitials = (name: string) => {
                      return name.split(/\\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
                    };

                    const renderDotRating = (rating: number) => (
                      <div className="flex gap-1.5 justify-end">
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <span key={dot} className={\`w-2.5 h-2.5 rounded-full \${dot <= rating ? 'bg-blue-500' : 'bg-gray-200'}\`} />
                        ))}
                      </div>
                    );

                    return activeTab === 'original' ? (
                      /* ORIGINAL TEXT RESUME */
                      <div className="bg-white p-8 md:p-12 shadow-md mx-auto max-w-3xl font-serif text-black min-h-[800px] border border-gray-200" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                        <div className="text-center mb-6">
                          <h1 className="text-xl font-bold underline mb-2">RESUME</h1>
                          <h2 className="text-lg font-bold uppercase">{resume.name}</h2>
                          <div className="text-sm mt-2 leading-tight">
                            <p>{resume.contact.location}</p>
                            <p>Mob No:- {resume.contact.phone}</p>
                            <p><strong>E-mail:- {resume.contact.email}</strong></p>
                          </div>
                        </div>

                        <div className="border-t-[3px] border-black my-4"></div>

                        <div className="mb-4">
                          <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Career Objective:</h3>
                          <p className="text-sm leading-relaxed px-2 text-justify">{resume.summary}</p>
                        </div>

                        <div className="mb-4">
                          <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Expertise Summary</h3>
                          <p className="text-sm px-2">Expertise in {resume.title}</p>
                        </div>

                        <div className="mb-4">
                          <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Competencies:</h3>
                          <ul className="list-disc pl-8 text-sm space-y-1">
                            {resume.strengths.map((s, i) => (
                              <li key={i}>{s.desc}</li>
                            ))}
                            {resume.skills.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="mb-4">
                          <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Educational Qualification</h3>
                          <ul className="list-disc pl-8 text-sm space-y-1">
                            {resume.education.map((edu, i) => (
                              <li key={i}>Completed {edu.degree} from {edu.school}, {edu.location} ({edu.dates.split(' - ')[1] || edu.dates})</li>
                            ))}
                          </ul>
                        </div>

                        <div className="mb-4">
                          <h3 className="bg-gray-300 font-bold border border-black px-2 py-0.5 text-sm mb-2">Experiences</h3>
                          <ul className="list-disc pl-8 text-sm space-y-2">
                            {resume.experience.map((exp, i) => (
                              <li key={i}>
                                Worked experience as a "{exp.role}" at {exp.company} <br/>
                                {exp.location} from {exp.dates}.
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      /* ENHANCED RESUME */
                      <div className="bg-white p-8 md:p-12 shadow-2xl mx-auto max-w-3xl font-sans text-gray-800 min-h-[800px] rounded-sm">
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <h1 className="text-4xl font-black uppercase text-gray-900 tracking-tight mb-1">{resume.name}</h1>
                            <h2 className="text-lg font-bold text-blue-500 mb-4">{resume.title}</h2>
                            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-600">
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-blue-500" /> {resume.contact.phone.split(',')[0]}</span>
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-500" /> {resume.contact.email}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> {resume.contact.location}</span>
                            </div>
                          </div>
                          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
                            {getInitials(resume.name)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {/* Left Col */}
                          <div className="md:col-span-2 space-y-8">
                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Experience</h3>
                              <div className="space-y-6">
                                {resume.experience.map((exp, i) => (
                                  <div key={i}>
                                    <h4 className="font-bold text-gray-900">{exp.role}</h4>
                                    <h5 className="font-bold text-blue-500 text-sm mb-1">{exp.company}</h5>
                                    <div className="flex gap-4 text-[10px] text-gray-500 font-bold mb-3">
                                      <span>📅 {exp.dates}</span>
                                      <span>📍 {exp.location}</span>
                                    </div>
                                    {exp.bulletPoints && (
                                      <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc marker:text-blue-500">
                                        {exp.bulletPoints.map((bp, j) => (
                                          <li key={j} className="leading-relaxed">{bp}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Education</h3>
                              <div className="space-y-4">
                                {resume.education.map((edu, i) => (
                                  <div key={i}>
                                    <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                                    <h5 className="font-bold text-blue-500 text-sm mb-1">{edu.school}</h5>
                                    <div className="flex gap-4 text-[10px] text-gray-500 font-bold">
                                      <span>📅 {edu.dates}</span>
                                      <span>📍 {edu.location}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>

                          {/* Right Col */}
                          <div className="space-y-8">
                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Summary</h3>
                              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                {resume.summary}
                              </p>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Strengths</h3>
                              <div className="space-y-3">
                                {resume.strengths.map((s, i) => (
                                  <div key={i}>
                                    <div className="flex gap-2 items-center mb-1">
                                      <Zap className="w-3 h-3 text-blue-500" />
                                      <h4 className="font-bold text-sm text-gray-900">{s.name}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium pl-5">{s.desc}</p>
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Key Achievements</h3>
                              <div className="space-y-3">
                                {resume.achievements.map((a, i) => (
                                  <div key={i}>
                                    <div className="flex gap-2 items-start mb-1">
                                      <Target className="w-3 h-3 text-blue-500 mt-0.5" />
                                      <h4 className="font-bold text-sm text-gray-900 leading-tight">{a.title}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium pl-5">{a.desc}</p>
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Skills</h3>
                              <div className="flex flex-wrap gap-y-2">
                                {resume.skills.map((s, i) => (
                                  <div key={i} className="w-1/2 pr-2">
                                    <div className="text-[10px] font-bold text-gray-700 border-b border-gray-100 pb-1">{s}</div>
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Interests</h3>
                              <div className="space-y-3">
                                {resume.interests.map((s, i) => (
                                  <div key={i}>
                                    <div className="flex gap-2 items-center mb-1">
                                      <Sparkles className="w-3 h-3 text-blue-500" />
                                      <h4 className="font-bold text-[10px] text-gray-900">{s.name}</h4>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium pl-5 leading-tight">{s.desc}</p>
                                  </div>
                                ))}
                              </div>
                            </section>

                            <section>
                              <h3 className="text-sm font-black tracking-widest uppercase border-b-2 border-black pb-1 mb-4">Languages</h3>
                              <div className="space-y-2">
                                {resume.languages.map((l, i) => (
                                  <div key={i}>
                                    <h4 className="font-bold text-[10px] text-gray-900 mb-0.5">{l.name}</h4>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-gray-500">{l.label}</span>
                                      {renderDotRating(l.level)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </section>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30">
                    <Button className="h-14 px-8 rounded-2xl bg-[#5542b8] hover:bg-[#463699] text-white font-bold text-sm shadow-2xl border-0 tracking-wide">
                      Build an ATS-friendly Resume
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
`;

content = content.substring(0, startIndex) + newContent + content.substring(endIndex + targetEnd.length);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated ats-score/page.tsx with the new UI!');
