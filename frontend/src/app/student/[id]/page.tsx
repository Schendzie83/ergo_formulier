'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Option {
  id: number;
  text: string;
  value: string;
  orderIndex: number;
}

interface LogicRule {
  id: number;
  targetQuestionId: number;
  triggerQuestionId: number;
  triggerOptionId: number;
  action: 'SHOW' | 'HIDE';
}

interface Question {
  id: number;
  text: string;
  type: 'multiple_choice' | 'text' | 'date' | 'number' | 'section';
  orderIndex: number;
  required: boolean;
  allowMultipleAnswers?: boolean;
  parentId?: number | null;
  description?: string;
  placeholder?: string;
  Options?: Option[];
  TargetRules?: LogicRule[];
}

interface Form {
  id: number;
  title: string;
  description: string;
  Questions: Question[];
  LogicRules: LogicRule[];
}

export default function StudentForm() {
  const params = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [visibleQuestions, setVisibleQuestions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (params.id) fetchForm();
  }, [params.id]);

  const fetchForm = async () => {
    try {
      const res = await api.get(`/forms/${params.id}`);
      const formData = res.data;
      
      // Sort questions
      formData.Questions.sort((a: Question, b: Question) => a.orderIndex - b.orderIndex);
      
      setForm(formData);
      
      // Initialize visibility
      // By default, show all questions that don't have "SHOW" rules targeting them.
      // Actually, if a question is a target of a SHOW rule, it should be hidden initially.
      // If it's a target of a HIDE rule, it should be shown initially.
      // Let's assume 'SHOW' is the primary logic: "Show Q2 if Q1=A". So Q2 is hidden by default.
      
      updateVisibility(formData, {});
    } catch (error) {
      console.error('Failed to fetch form', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVisibility = (currentForm: Form, currentAnswers: Record<number, any>) => {
    const newVisible = new Set<number>();
    
    // First pass: Identify questions that have ANY dependency
    // We need to check all LogicRules.
    // But simpler: Iterate questions and check their TargetRules.
    
    // Wait, the backend returns LogicRules at the form level too.
    // Let's use that.
    
    // Map of questionId -> list of rules targeting it
    const rulesByTarget = new Map<number, LogicRule[]>();
    currentForm.LogicRules.forEach(rule => {
      if (!rulesByTarget.has(rule.targetQuestionId)) {
        rulesByTarget.set(rule.targetQuestionId, []);
      }
      rulesByTarget.get(rule.targetQuestionId)?.push(rule);
    });
    
    currentForm.Questions.forEach(q => {
      const targetRules = rulesByTarget.get(q.id);
      
      if (!targetRules || targetRules.length === 0) {
        // No rules targeting this question -> Always visible
        newVisible.add(q.id);
      } else {
        // Evaluate rules
        // For 'SHOW' action: Visible if ANY rule matches (OR logic) or ALL? Usually OR if multiple triggers show it.
        // Let's assume OR for now.
        
        let shouldShow = false;
        
        for (const rule of targetRules) {
          if (rule.action === 'SHOW') {
            // Check if trigger condition is met
            const triggerAnswer = currentAnswers[rule.triggerQuestionId];
            // Assuming trigger is MCQ and answer is the Option ID or text?
            // Backend stores Option ID in LogicRule.triggerOptionId.
            // Frontend answers might store Option ID or Text.
            // Let's store Option ID for MCQs.
            
            if (Array.isArray(triggerAnswer)) {
               if (triggerAnswer.some(val => String(val) === String(rule.triggerOptionId))) {
                   shouldShow = true;
                   break;
               }
            } else {
               if (String(triggerAnswer) === String(rule.triggerOptionId)) {
                 shouldShow = true;
                 break; 
               }
            }
          }
        }
        
        if (shouldShow) {
          newVisible.add(q.id);
        }
      }
    });
    
    setVisibleQuestions(newVisible);
  };

  const handleAnswerChange = (questionId: number, value: any, isMultiple: boolean = false) => {
    const newAnswerState = { ...answers };
    
    if (isMultiple) {
        const currentVal = newAnswerState[questionId] || [];
        const currentArray = Array.isArray(currentVal) ? currentVal : [currentVal];
        const valStr = String(value);
        
        if (currentArray.some((v: any) => String(v) === valStr)) {
            // Remove
            newAnswerState[questionId] = currentArray.filter((v: any) => String(v) !== valStr);
        } else {
            // Add
            newAnswerState[questionId] = [...currentArray, value];
        }
    } else {
        newAnswerState[questionId] = value;
    }

    setAnswers(newAnswerState);
    if (form) updateVisibility(form, newAnswerState);
  };

  const generateDocument = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/documents/generate', {
        formId: form?.id,
        answers
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${form?.title || 'document'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to generate document', error);
      alert('Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!form) return <div className="p-8 text-center">Form not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/student" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Back to Form List">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{form.title}</h1>
            <p className="text-sm text-gray-500">Student View</p>
          </div>
        </div>
        <div>
            <img src="/zuyd-logo.png" alt="Zuyd Logo" className="h-12 w-auto object-contain" />
        </div>
      </header>

      <main className="flex-1 p-8 max-w-3xl mx-auto w-full space-y-8">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
          {/* Recursive Rendering */}
          {(() => {
              const renderQuestionsRecursively = (parentId: number | null, depth: number = 0) => {
                  if (!form) return null;
                  
                  const items = form.Questions
                      .filter(q => q.parentId === (parentId || null)) // handle undefined as null
                      .sort((a,b) => a.orderIndex - b.orderIndex);

                  if (items.length === 0) return null;

                  return (
                      <div className={`space-y-6 ${depth > 0 ? 'ml-6 mt-4 border-l-2 border-gray-100 pl-4' : ''}`}>
                          {items.map(question => {
                              if (!visibleQuestions.has(question.id)) return null;

                              if (question.type === 'section') {
                                  return (
                                      <div key={question.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
                                          <h2 className={`font-bold text-gray-900 ${depth === 0 ? 'text-2xl border-b pb-2' : 'text-xl'}`}>
                                              {question.text}
                                          </h2>
                                          {renderQuestionsRecursively(question.id, depth + 1)}
                                      </div>
                                  );
                              }

                              return (
                                  <div key={question.id} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                      <label className="block text-lg font-medium text-gray-900">
                                          {question.text}
                                          {question.required && <span className="text-red-500 ml-1">*</span>}
                                      </label>
                                      {question.description && (
                                        <p className="text-sm text-gray-500 mb-2">{question.description}</p>
                                      )}
                                      
                                      {question.type === 'text' && (
                                          <input
                                              type="text"
                                              className="w-full rounded-lg border-2 border-gray-300 p-3 bg-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all placeholder:text-gray-400 focus:outline-none"
                                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                              value={answers[question.id] || ''}
                                              placeholder="Type your answer here..."
                                          />
                                      )}
                                      
                                      {question.type === 'multiple_choice' && (
                                          <div className="space-y-2">
                                              {question.Options?.map(option => {
                                                  const isSelected = question.allowMultipleAnswers 
                                                      ? (Array.isArray(answers[question.id]) && answers[question.id].some((v: any) => String(v) === String(option.id)))
                                                      : String(answers[question.id]) === String(option.id);

                                                  return (
                                                      <label key={option.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-red-50 border-red-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                                                          <input
                                                              type={question.allowMultipleAnswers ? "checkbox" : "radio"}
                                                              name={`q-${question.id}`}
                                                              value={option.id}
                                                              checked={isSelected}
                                                              onChange={() => handleAnswerChange(question.id, option.id, question.allowMultipleAnswers)}
                                                              className="text-red-600 focus:ring-red-500 accent-red-600"
                                                          />
                                                          <span className="text-gray-700">{option.text}</span>
                                                      </label>
                                                  )
                                              })}
                                          </div>
                                      )}

                                      {question.type === 'date' && (
                                          <input
                                              type="date"
                                              className="w-full rounded-lg border-2 border-gray-300 p-3 bg-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all focus:outline-none"
                                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                              value={answers[question.id] || ''}
                                          />
                                      )}

                                      {question.type === 'number' && (
                                          <input
                                              type="number"
                                              className="w-full rounded-lg border-2 border-gray-300 p-3 bg-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-all placeholder:text-gray-400 focus:outline-none"
                                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                              value={answers[question.id] || ''}
                                              placeholder="0"
                                          />
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  );
              };

              return renderQuestionsRecursively(null);
          })()}
        </div>

        <div className="flex justify-end">
          <button
            onClick={generateDocument}
            disabled={generating}
            className="flex items-center gap-2 px-8 py-4 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition-all transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#E30613' }}
          >
            {generating ? 'Generating...' : (
              <>
                <Download className="w-6 h-6" />
                Generate Document
              </>
            )}
          </button>
        </div>
      </main>
      
      {/* Footer */}
      <div className="bg-white py-8 text-center border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-center gap-4 select-none">
            <img src="/zuyd-logo.png" alt="Zuyd Hogeschool Ergotherapie" className="h-12 w-auto" />
        </div>
      </div>
    </div>
  );
}
