'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import axios from 'axios';
import Link from 'next/link';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Save, ArrowLeft, Trash2, Settings, GripVertical, GitBranch, X, Lock } from 'lucide-react';



interface Option {
  id?: number;
  text: string;
  value: string;
  orderIndex: number;
}

interface LogicRule {
  id?: number;
  formId: number;
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
  placeholder?: string;
  description?: string;
  Options?: Option[];
  LogicRules?: LogicRule[]; // Rules where this question is the target
}

interface Form {
  id: number;
  title: string;
  description: string;
  isPublic: boolean;
  isLocked: boolean;
  Questions: Question[];
  LogicRules?: LogicRule[]; // All rules in the form
}

function LogicEditor({ question, form, onClose, onSave }: { question: Question, form: Form, onClose: () => void, onSave: () => void }) {
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, [question.id]);

  const fetchRules = async () => {
    try {
      const formRules = form.LogicRules || [];
      const targetRules = formRules.filter(r => r.targetQuestionId === question.id);
      setRules(targetRules);
    } catch (error) {
      console.error('Failed to fetch rules', error);
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    try {
      const potentialTriggers = form.Questions.filter(q => q.id !== question.id && q.type === 'multiple_choice');
      if (potentialTriggers.length === 0) {
        alert('No multiple choice questions available to use as triggers.');
        return;
      }
      const triggerQ = potentialTriggers[0];
      if (!triggerQ.Options || triggerQ.Options.length === 0) {
        alert('Trigger question has no options.');
        return;
      }

      const newRule = {
        formId: form.id,
        targetQuestionId: question.id,
        triggerQuestionId: triggerQ.id,
        triggerOptionId: triggerQ.Options[0].id!,
        action: 'SHOW' as const
      };

      const res = await api.post('/logic', newRule);
      setRules([...rules, res.data]);
      onSave(); // Trigger parent refresh
    } catch (error) {
      console.error('Failed to add rule', error);
    }
  };

  const updateRule = async (ruleId: number, updates: Partial<LogicRule>) => {
    try {
      const res = await api.put(`/logic/${ruleId}`, updates);
      setRules(rules.map(r => r.id === ruleId ? res.data : r));
      onSave();
    } catch (error) {
      console.error('Failed to update rule', error);
    }
  };

  const deleteRule = async (ruleId: number) => {
    try {
      await api.delete(`/logic/${ruleId}`);
      setRules(rules.filter(r => r.id !== ruleId));
      onSave();
    } catch (error) {
      console.error('Failed to delete rule', error);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">Loading...</div>;

  const potentialTriggers = form.Questions.filter(q => q.id !== question.id && q.type === 'multiple_choice');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Logic for "{question.text}"</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {rules.length === 0 && (
            <p className="text-gray-500 text-center py-8">No logic rules defined. This question is always visible.</p>
          )}

          {rules.map((rule, index) => {
            const triggerQ = form.Questions.find(q => q.id === rule.triggerQuestionId);
            
            return (
              <div key={rule.id || index} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{rule.action}</span>
                    <span>this question if:</span>
                    <button 
                    onClick={() => deleteRule(rule.id!)}
                    className="ml-auto text-red-500 hover:text-red-700"
                    >
                    <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Question:</span>
                    <select
                        value={rule.triggerQuestionId}
                        onChange={(e) => {
                            const newQId = Number(e.target.value);
                            const newQ = form.Questions.find(q => q.id === newQId);
                            const newOptId = newQ?.Options?.[0]?.id;
                            if (newOptId) {
                                updateRule(rule.id!, { triggerQuestionId: newQId, triggerOptionId: newOptId });
                            }
                        }}
                        className="flex-1 rounded-md border-gray-300 text-sm"
                    >
                        {potentialTriggers.map(q => (
                            <option key={q.id} value={q.id}>{q.text}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Answer is:</span>
                    <select
                        value={rule.triggerOptionId}
                        onChange={(e) => updateRule(rule.id!, { triggerOptionId: Number(e.target.value) })}
                        className="flex-1 rounded-md border-gray-300 text-sm"
                    >
                        {triggerQ?.Options?.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.text}</option>
                        ))}
                    </select>
                </div>
              </div>
            );
          })}

          <button
            onClick={addRule}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Logic Rule
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableQuestion({ question, handleQuestionChange, saveQuestion, addOption, updateOptionText, deleteOption, deleteQuestion, onOpenLogic, isSection, children }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white rounded-xl border shadow-sm p-6 group flex gap-4 ${isSection ? 'border-red-100 bg-red-50/10' : 'border-gray-200'}`}>
      <div {...attributes} {...listeners} className="mt-2 cursor-move text-gray-300 hover:text-gray-600 transition-colors">
        <GripVertical className="w-5 h-5" />
      </div>
      
      <div className="flex-1 flex items-start gap-4">
        <div className="flex-1 space-y-4">
          <input
            type="text"
            value={question.text}
            onChange={(e) => handleQuestionChange({ ...question, text: e.target.value })}
            className={`w-full text-lg font-medium text-gray-900 border-none focus:ring-0 p-0 placeholder-gray-300 ${isSection ? 'text-xl font-bold text-gray-900' : ''}`}
            placeholder={isSection ? "Step Title" : "Question Text"}
            onBlur={() => saveQuestion(question)}
          />

          {!isSection && (
              <textarea
                value={question.description || ''}
                onChange={(e) => handleQuestionChange({ ...question, description: e.target.value })}
                className="w-full text-sm text-gray-500 border-none focus:ring-0 p-0 placeholder-gray-300 resize-none h-auto bg-transparent focus:bg-gray-50 rounded px-1 transition-colors"
                placeholder="Add an explanation or helper text for students..."
                rows={1}
                onBlur={() => saveQuestion(question)}
              />
          )}
          
          <div className="flex items-center gap-4">
            <select
              value={question.type}
              onChange={(e) => {
                const updated = { ...question, type: e.target.value as any };
                handleQuestionChange(updated);
                saveQuestion(updated);
              }}
              className="block w-40 rounded-lg border-gray-300 text-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="text">Text Answer</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="date">Date</option>
              <option value="number">Number</option>
            </select>
            
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => {
                  const updated = { ...question, required: e.target.checked };
                  handleQuestionChange(updated);
                  saveQuestion(updated);
                }}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Required
            </label>

            <button
              onClick={() => onOpenLogic(question)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              <GitBranch className="w-4 h-4" />
              Logic
            </button>
          </div>

          {/* Options for Multiple Choice */}
          {question.type === 'multiple_choice' && (
            <div className="pl-4 border-l-2 border-gray-100 space-y-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <input
                  type="checkbox"
                  checked={question.allowMultipleAnswers || false}
                  onChange={(e) => {
                    const updated = { ...question, allowMultipleAnswers: e.target.checked };
                    handleQuestionChange(updated);
                    saveQuestion(updated);
                  }}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                Allow Multiple Selections (Checkboxes)
              </label>

              {question.Options?.map((option: any, optIndex: number) => (
                <div key={optIndex} className="flex items-center gap-2 group/option">
                  <div className="w-4 h-4 rounded-full border border-gray-300" />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOptionText(question, optIndex, e.target.value)}
                    onBlur={() => saveQuestion(question)}
                    className="flex-1 text-sm border-gray-200 rounded-md focus:border-red-500 focus:ring-red-500"
                    placeholder={`Option ${optIndex + 1}`}
                  />
                  <button 
                    onClick={() => deleteOption(question, optIndex)}
                    className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover/option:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  addOption(question);
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Option
              </button>
            </div>
          )}
          
          {children}
        </div>

        <button 
          onClick={() => deleteQuestion(question.id)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function FormBuilder() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLogicQuestion, setActiveLogicQuestion] = useState<Question | null>(null);
  const lastSaveRequestTime = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (params.id) fetchForm();
  }, [params.id]);

  const fetchForm = async () => {
    try {
      const res = await api.get(`/forms/${params.id}`);
      if (res.data.Questions) {
        res.data.Questions.sort((a: Question, b: Question) => a.orderIndex - b.orderIndex);
      } else {
        res.data.Questions = [];
      }
      setForm(res.data);
    } catch (error) {
      console.error('Failed to fetch form', error);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async (parentId?: number, type: 'text' | 'section' = 'text') => {
    if (!form) return;
    try {
      const siblings = form.Questions.filter(q => q.parentId === (parentId || null));
      
      const newQuestion = {
        formId: form.id,
        text: type === 'section' ? 'New Chapter' : 'New Question',
        type: type,
        orderIndex: siblings.length,
        required: true,
        allowMultipleAnswers: false,
        parentId: parentId || null
      };
      
      const res = await api.post('/questions', newQuestion);
      setForm({
        ...form,
        Questions: [...form.Questions, res.data]
      });
    } catch (error) {
      console.error('Failed to add question', error);
    }
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      if (form) {
        setForm({
          ...form,
          Questions: form.Questions.filter(q => q.id !== id)
        });
      }
    } catch (error) {
      console.error('Failed to delete question', error);
    }
  };

  const handleQuestionChange = (question: Question) => {
    if (!form) return;
    setForm({
      ...form,
      Questions: form.Questions.map(q => q.id === question.id ? question : q)
    });
  };

  const saveQuestion = async (question: Question) => {
    const requestTime = Date.now();
    lastSaveRequestTime.current = requestTime;

    try {
      const res = await api.put(`/questions/${question.id}`, question);
      
      if (requestTime >= lastSaveRequestTime.current) {
        if (form) {
          setForm(prev => {
            if (!prev) return null;
            const currentQuestion = prev.Questions.find(q => q.id === question.id);
            if (!currentQuestion) return prev; 

            const serverQuestion = res.data;
            const mergedQuestion = { ...currentQuestion };

            if (serverQuestion.Options && mergedQuestion.Options) {
              mergedQuestion.Options = mergedQuestion.Options.map(localOpt => {
                let serverOpt;
                if (localOpt.id) {
                  serverOpt = serverQuestion.Options.find((so: any) => so.id === localOpt.id);
                } else {
                  serverOpt = serverQuestion.Options.find((so: any) => so.orderIndex === localOpt.orderIndex);
                }

                if (serverOpt) {
                  return {
                    ...localOpt,
                    id: serverOpt.id,
                  };
                }
                return localOpt;
              });
            }
            
            return {
              ...prev,
              Questions: prev.Questions.map(q => q.id === question.id ? mergedQuestion : q)
            };
          });
        }
      }
    } catch (error) {
      console.error('Failed to update question', error);
    }
  };

  const addOption = async (question: Question) => {
    const newOption: Option = {
      text: `Option ${(question.Options?.length || 0) + 1}`,
      value: `option_${(question.Options?.length || 0) + 1}`,
      orderIndex: (question.Options?.length || 0)
    };
    
    const updatedQuestion = {
      ...question,
      Options: [...(question.Options || []), newOption]
    };
    
    handleQuestionChange(updatedQuestion); 
    await saveQuestion(updatedQuestion); 
  };

  const updateOptionText = (question: Question, optionIndex: number, text: string) => {
    const newOptions = [...(question.Options || [])];
    newOptions[optionIndex] = { ...newOptions[optionIndex], text, value: text };
    
    const updatedQuestion = { ...question, Options: newOptions };
    handleQuestionChange(updatedQuestion);
  };

  const deleteOption = async (question: Question, optionIndex: number) => {
    const newOptions = (question.Options || []).filter((_, index) => index !== optionIndex);
    const updatedQuestion = { ...question, Options: newOptions };
    
    handleQuestionChange(updatedQuestion);
    await saveQuestion(updatedQuestion);
  };

  const saveForm = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await api.put(`/forms/${form.id}`, {
        title: form.title,
        description: form.description,
        isPublic: form.isPublic
      });
      await Promise.all(form.Questions.map(q => saveQuestion(q)));
      alert('Form saved successfully!');
    } catch (error) {
      console.error('Failed to save form', error);
      alert('Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id && form) {
      const activeQ = form.Questions.find(q => q.id === active.id);
      const overQ = form.Questions.find(q => q.id === over?.id);

      if (!activeQ || !overQ) return;

      if (activeQ.parentId === overQ.parentId) {
          const siblings = form.Questions
            .filter(q => q.parentId === activeQ.parentId)
            .sort((a, b) => a.orderIndex - b.orderIndex);

          const oldIndex = siblings.findIndex(q => q.id === active.id);
          const newIndex = siblings.findIndex(q => q.id === over?.id);

          const newSiblings = arrayMove(siblings, oldIndex, newIndex);

          const updates = newSiblings.map((q, idx) => ({ ...q, orderIndex: idx }));

          setForm(prev => {
              if (!prev) return null;
              return {
                  ...prev,
                  Questions: prev.Questions.map(q => {
                      const updated = updates.find(u => u.id === q.id);
                      return updated ? updated : q;
                  })
              };
          });

          updates.forEach(q => saveQuestion(q));
      }
    }
  };

  const togglePublish = async () => {
    if (!form) return;
    try {
        const updatedForm = { ...form, isPublic: !form.isPublic };
        await api.put(`/forms/${form.id}`, { isPublic: updatedForm.isPublic });
        setForm(updatedForm);
    } catch (error) {
        console.error('Failed to update public status', error);
        alert('Failed to update status');
    }
  };

  const toggleLock = async () => {
    if (!form) return;
    try {
        const updatedForm = { ...form, isLocked: !form.isLocked };
        await api.put(`/forms/${form.id}`, { isLocked: updatedForm.isLocked });
        setForm(updatedForm);
    } catch (error) {
        console.error('Failed to update locked status', error);
        alert('Failed to update status');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!form) return <div className="p-8 text-center">Form not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Back to Dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 bg-transparent focus:underline hover:underline cursor-text"
            />
            <p className="text-sm text-gray-500">Form Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
             <button 
                onClick={toggleLock}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${form.isLocked ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-200'}`}
                title="Lock this form to prevent deletion"
             >
                <Lock className="w-3 h-3" />
                {form.isLocked ? 'Locked' : 'Unlocked'}
             </button>
             <div className="h-4 w-px bg-gray-300 mx-1"></div>
             <button 
                onClick={togglePublish}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${form.isPublic ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-200'}`}
             >
                {form.isPublic ? 'Public' : 'Draft'}
             </button>
             <button
                onClick={togglePublish}
                className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${form.isPublic ? 'bg-green-600 after:translate-x-full border-green-600' : 'bg-gray-300'}`}
             >
             </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button 
            onClick={saveForm}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            style={{ backgroundColor: '#E30613' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <div className="pl-4 border-l border-gray-200 ml-2">
            <img src="/zuyd-logo.png" alt="Zuyd Logo" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-6">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {/* Recursive Rendering */}
            {(() => {
                const renderQuestionsRecursively = (parentId: number | null) => {
                    const items = form.Questions
                        .filter(q => q.parentId === parentId)
                        .sort((a,b) => a.orderIndex - b.orderIndex);

                    if (items.length === 0 && parentId === null) return null; 

                    return (
                        <SortableContext 
                            items={items.map(q => q.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {items.map((question, index) => {
                                    if (question.type === 'section') {
                                        return (
                                            <SortableQuestion
                                                key={question.id}
                                                question={question}
                                                index={index}
                                                handleQuestionChange={handleQuestionChange}
                                                saveQuestion={saveQuestion}
                                                addOption={addOption}
                                                updateOptionText={updateOptionText}
                                                deleteOption={deleteOption}
                                                deleteQuestion={deleteQuestion}
                                                onOpenLogic={setActiveLogicQuestion}
                                                isSection={true}
                                            >
                                                {/* Recursive Children */}
                                                <div className="ml-8 mt-4 space-y-4 border-l-2 border-dashed border-red-100 pl-4">
                                                    {renderQuestionsRecursively(question.id)}
                                                    
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => addQuestion(question.id, 'text')}
                                                            className="flex-1 py-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Add Question to Step
                                                        </button>
                                                        <button
                                                            onClick={() => addQuestion(question.id, 'section')}
                                                            className="flex-1 py-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <GitBranch className="w-3 h-3" />
                                                            Add Sub-Chapter
                                                        </button>
                                                    </div>
                                                </div>
                                            </SortableQuestion>
                                        );
                                    }

                                    return (
                                        <SortableQuestion
                                            key={question.id}
                                            question={question}
                                            index={index}
                                            handleQuestionChange={handleQuestionChange}
                                            saveQuestion={saveQuestion}
                                            addOption={addOption}
                                            updateOptionText={updateOptionText}
                                            deleteOption={deleteOption}
                                            deleteQuestion={deleteQuestion}
                                            onOpenLogic={setActiveLogicQuestion}
                                        />
                                    );
                                })}
                            </div>
                        </SortableContext>
                    );
                };

                return renderQuestionsRecursively(null);
            })()}
        </DndContext>

        <div className="grid grid-cols-2 gap-4">
            <button
            onClick={() => addQuestion(undefined, 'section')}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
            <Plus className="w-5 h-5" />
            Add New Chapter/Step
            </button>
            <button
            onClick={() => addQuestion()}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-2 font-medium"
            >
            <Plus className="w-5 h-5" />
            Add Standalone Question
            </button>
        </div>
      </main>

      {/* Footer */}
      <div className="bg-white py-8 text-center border-t border-gray-100 mt-auto">
        <div className="flex items-center justify-center gap-4 select-none">
            <img src="/zuyd-logo.png" alt="Zuyd Hogeschool Ergotherapie" className="h-12 w-auto" />
        </div>
      </div>

      {activeLogicQuestion && (
        <LogicEditor 
          question={activeLogicQuestion} 
          form={form} 
          onClose={() => setActiveLogicQuestion(null)}
          onSave={() => {
            fetchForm(); // Refresh form to get new rules
          }}
        />
      )}
    </div>
  );
}
