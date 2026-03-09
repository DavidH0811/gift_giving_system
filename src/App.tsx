import React, { useState } from 'react';
import { Activity, EventType, GiftRecord, Guest } from './types';
import { api } from './api';
import Layout from './components/Layout';
import ActivityItem from './components/ActivityItem';
import RecordItem from './components/RecordItem';
import { motion, AnimatePresence } from 'motion/react';

type View = 'home' | 'search' | 'add' | 'stats' | 'profile' | 'activity_records';

export default function App() {
  // 移除 useEffect 中的自动下载
  const handleDownloadApk = () => {
    const link = document.createElement('a');
    link.href = '/suili.apk';
    link.download = '随礼账本.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [activeTab, setActiveTab] = useState<string>('home');
  const [view, setView] = useState<View>('home');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [records, setRecords] = useState<GiftRecord[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Record Form State
  const [giverName, setGiverName] = useState('');
  const [amount, setAmount] = useState('0.00');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isActivityPickerOpen, setIsActivityPickerOpen] = useState(false);
  const [isAddingNewActivity, setIsAddingNewActivity] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState('');

  React.useEffect(() => {
    Promise.all([
      api.getActivities(),
      api.getRecords(),
      api.getGuests()
    ]).then(([activitiesData, recordsData, guestsData]) => {
      setActivities(activitiesData);
      setRecords(recordsData);
      setGuests(guestsData);
      if (activitiesData.length > 0) {
        setSelectedActivity(activitiesData[0]);
      }
      setIsLoading(false);
    }).catch(console.error);
  }, []);

  // Search and Edit State
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditingInDetail, setIsEditingInDetail] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GiftRecord | null>(null);
  const [selectedActivityForList, setSelectedActivityForList] = useState<Activity | null>(null);

  // Body scroll lock
  React.useEffect(() => {
    const isAnyModalOpen = isDetailOpen || isActivityPickerOpen || isAddingNewActivity || view === 'add';
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDetailOpen, isActivityPickerOpen, isAddingNewActivity, view]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setView(tab as View);
    if (tab !== 'add') {
      setEditingRecordId(null);
      setGiverName('');
      setAmount('0.00');
      setIsDetailOpen(false);
      setIsEditingInDetail(false);
      setSelectedActivityForList(null);
    }
  };

  const handleViewRecordDetail = (record: GiftRecord) => {
    setSelectedRecord(record);
    setEditingRecordId(record.id);
    setGiverName(record.giverName);
    setAmount(record.amount.toString());
    const activity = activities.find(a => a.id === record.activityId) || (activities.length > 0 ? activities[0] : null);
    setSelectedActivity(activity);
    setIsDetailOpen(true);
    setIsEditingInDetail(false);
  };

  const handleAddNewActivity = async () => {
    if (!newActivityTitle.trim()) return;
    try {
      const newActivity = await api.createActivity({
        title: newActivityTitle,
        type: EventType.OTHER,
        date: new Date().toISOString().split('T')[0]
      });
      setActivities(prev => [newActivity, ...prev]);
      setSelectedActivity(newActivity);
      setIsAddingNewActivity(false);
      setNewActivityTitle('');
      setIsActivityPickerOpen(false);
    } catch (error) {
      console.error(error);
      alert('添加活动失败');
    }
  };

  const handleSaveRecord = async () => {
    if (!giverName.trim() || parseFloat(amount) <= 0 || !selectedActivity) return;

    try {
      if (editingRecordId) {
        // Update existing record
        const updatedRecord = await api.updateRecord(editingRecordId, {
          activityId: selectedActivity.id,
          activityTitle: selectedActivity.title,
          giverName,
          amount: parseFloat(amount)
        });
        setRecords(prev => prev.map(r => r.id === editingRecordId ? updatedRecord : r));
      } else {
        // Create new record
        const newRecord = await api.createRecord({
          activityId: selectedActivity.id,
          activityTitle: selectedActivity.title,
          giverName,
          amount: parseFloat(amount)
        });
        setRecords(prev => [newRecord, ...prev]);
        if (!guests.find(g => g.name === giverName)) {
          setGuests(prev => [...prev, { id: Date.now().toString(), name: giverName }]);
        }
      }

      api.getActivities().then(setActivities); // refresh total amounts

      setView('home');
      setEditingRecordId(null);
      setGiverName('');
      setAmount('0.00');
      setIsDetailOpen(false);
      setIsEditingInDetail(false);
    } catch (error) {
      console.error(error);
      alert('保存失败');
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      setAmount(prev => {
        if (prev.length <= 1) return '0.00';
        const next = prev.slice(0, -1);
        if (next === '0.' || next === '0') return '0.00';
        return next;
      });
      return;
    }

    setAmount(prev => {
      if (prev === '0.00') return val === '.' ? '0.' : val;
      if (val === '.' && prev.includes('.')) return prev;
      return prev + val;
    });
  };

  const renderHome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full"
    >
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">card_giftcard</span>
            <h1 className="text-xl font-bold tracking-tight">随礼账本</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="bg-primary rounded-xl p-6 text-white shadow-lg shadow-primary/20">
          <p className="text-white/80 text-sm font-medium">今年累计收到</p>
          <h2 className="text-3xl font-bold mt-1">¥14,250.00</h2>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium bg-white/20 w-fit px-2 py-1 rounded-full">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            <span>+12.5% 同比去年</span>
          </div>
        </div>

        {/* 新增：下载安卓版引导入口 */}
        <div 
          onClick={handleDownloadApk}
          className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-100 active:scale-[0.98] transition-all group"
        >
          <div className="size-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-2xl">android</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">下载安卓原生 APP</h3>
            <p className="text-xs text-slate-500 mt-0.5">安装后体验更流畅，支持桌面图标</p>
          </div>
          <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">download</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-lg font-bold">最近活动</h2>
        <button className="text-primary text-sm font-semibold hover:underline">查看全部</button>
      </div>

      <div className="space-y-3 px-4">
        {activities.map(activity => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onClick={() => {
              setSelectedActivityForList(activity);
              setView('activity_records');
            }}
          />
        ))}
      </div>
    </motion.div>
  );

  const renderSearch = () => {
    const filteredRecords = records.filter(record =>
      record.giverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.activityTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col h-full"
      >
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center justify-between px-4 py-4">
            <button onClick={() => setView('home')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold tracking-tight">统计与搜索</h1>
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100">
              <span className="material-symbols-outlined text-slate-600">more_horiz</span>
            </button>
          </div>

          <div className="px-4 pb-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
              </div>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-slate-400 text-sm outline-none"
                placeholder="搜索姓名或活动"
                type="text"
              />
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 overflow-y-auto py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">
              {searchQuery ? `搜索结果 (${filteredRecords.length})` : '最近结果'}
            </h2>
            {!searchQuery && <button className="text-xs font-semibold text-primary hover:underline">查看全部</button>}
          </div>

          {filteredRecords.length > 0 ? (
            <div className="space-y-1">
              {filteredRecords.map(record => {
                const activity = activities.find(a => a.id === record.activityId);
                return (
                  <RecordItem
                    key={record.id}
                    record={record}
                    activityType={activity?.type}
                    onClick={() => handleViewRecordDetail(record)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-20">search_off</span>
              <p className="text-sm font-medium">未找到相关记录</p>
              <p className="text-xs mt-1 opacity-60">尝试输入不同的关键词</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderActivityRecords = () => {
    if (!selectedActivityForList) return null;
    const filteredRecords = records.filter(r => r.activityId === selectedActivityForList.id);

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col h-full"
      >
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center justify-between px-4 py-4">
            <button onClick={() => setView('home')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100">
              <span className="material-symbols-outlined text-slate-600">arrow_back</span>
            </button>
            <h1 className="text-lg font-bold tracking-tight">{selectedActivityForList.title}</h1>
            <div className="w-10 h-10" />
          </div>
          <div className="px-4 py-4 bg-primary/5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">总金额</p>
              <p className="text-xl font-black text-primary">¥{selectedActivityForList.totalAmount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">参与人数</p>
              <p className="text-xl font-black text-slate-900">{filteredRecords.length}人</p>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 overflow-y-auto py-4">
          <div className="space-y-1">
            {filteredRecords.length > 0 ? (
              filteredRecords.map(record => (
                <RecordItem
                  key={record.id}
                  record={record}
                  activityType={selectedActivityForList.type}
                  onClick={() => handleViewRecordDetail(record)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">person_off</span>
                <p className="text-sm font-medium">暂无参与者</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderAdd = () => (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className="flex flex-col h-full bg-white z-[9980]"
    >
      <div className="flex items-center bg-white p-4 border-b border-slate-200 justify-between sticky top-0 z-10">
        <div
          onClick={() => setView('home')}
          className="text-slate-900 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </div>
        <h2 className="text-slate-900 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          {editingRecordId ? '修改随礼记录' : '添加随礼记录'}
        </h2>
        <div className="size-10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">info</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-6 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1">当前活动</p>
          <div
            onClick={() => setIsActivityPickerOpen(true)}
            className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <h1 className="text-lg font-bold text-slate-900">{selectedActivity?.title || '加载中...'}</h1>
            <span className="material-symbols-outlined text-slate-400">expand_more</span>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">送礼人姓名</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person</span>
              <input
                value={giverName}
                onChange={(e) => setGiverName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="输入姓名或从下方选择"
                type="text"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">随礼金额</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">payments</span>
              <div className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-primary/20 rounded-xl text-3xl font-bold text-slate-900 flex items-center">
                ¥{amount}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(key => (
              <button
                key={key}
                onClick={() => handleKeypadPress(key)}
                className="h-14 bg-slate-100 hover:bg-slate-200 rounded-lg text-xl font-semibold flex items-center justify-center active:scale-95 transition-transform"
              >
                {key === 'backspace' ? (
                  <span className="material-symbols-outlined text-slate-500">backspace</span>
                ) : key}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-tight">最近客人</h4>
              <button className="text-xs font-bold text-primary hover:underline">查看全部</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {guests.map(guest => (
                <button
                  key={guest.id}
                  onClick={() => setGiverName(guest.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${giverName === guest.name ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {giverName === guest.name && <span className="material-symbols-outlined text-sm">check</span>}
                  {guest.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <button
          onClick={handleSaveRecord}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">{editingRecordId ? 'save' : 'add_circle'}</span>
          {editingRecordId ? '保存修改' : '保存记录'}
        </button>
      </div>
    </motion.div>
  );

  return (
    <>
      <Layout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hideNav={view === 'add'}
      >
        <AnimatePresence mode="wait">
          {view === 'home' && renderHome()}
          {view === 'search' && renderSearch()}
          {view === 'activity_records' && renderActivityRecords()}
          {view === 'add' && renderAdd()}
          {view === 'stats' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col h-full"
            >
              <header className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                <h1 className="text-lg font-bold tracking-tight">统计</h1>
              </header>
              <div className="px-4 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">总记录数</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold">1,284</span>
                      <span className="text-[10px] text-green-600 font-bold mb-1 flex items-center">
                        <span className="material-symbols-outlined text-[12px]">trending_up</span> 12%
                      </span>
                    </div>
                  </div>
                  <div className="bg-primary p-5 rounded-2xl shadow-lg shadow-primary/20">
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-1">总金额</p>
                    <p className="text-2xl font-bold text-white">¥45,200</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 px-4 flex flex-col items-center justify-center text-center opacity-50">
                <span className="material-symbols-outlined text-6xl mb-4">analytics</span>
                <p className="text-sm">更多统计图表正在开发中</p>
              </div>
            </motion.div>
          )}
          {view === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full p-12 text-center"
            >
              <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">settings</span>
              <h2 className="text-xl font-bold text-slate-900">设置</h2>
              <p className="text-slate-500 mt-2">设置中心正在建设中</p>
              <button
                onClick={() => handleTabChange('home')}
                className="mt-6 px-6 py-2 bg-primary text-white rounded-full font-medium"
              >
                返回首页
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {view !== 'add' && (
          <div className="fixed bottom-24 right-8 z-[55]">
            <button
              onClick={() => setView('add')}
              className="bg-primary text-white w-14 h-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-3xl">add</span>
            </button>
          </div>
        )}

      </Layout>

      {/* Record Detail Drawer */}
      <AnimatePresence>
        {isDetailOpen && selectedRecord && (
          <div className="fixed inset-0 z-[9990] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsDetailOpen(false);
                setIsEditingInDetail(false);
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <button
                  onClick={() => {
                    if (isEditingInDetail) {
                      setIsEditingInDetail(false);
                    } else {
                      setIsDetailOpen(false);
                    }
                  }}
                  className="size-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h3 className="text-lg font-bold">
                  {isEditingInDetail ? '修改记录' : '记录详情'}
                </h3>
                <button
                  onClick={() => {
                    if (isEditingInDetail) {
                      handleSaveRecord();
                    } else {
                      setIsEditingInDetail(true);
                    }
                  }}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
                >
                  {isEditingInDetail ? '完成' : '修改'}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {isEditingInDetail ? (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-1">当前活动</p>
                      <div
                        onClick={() => setIsActivityPickerOpen(true)}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <h1 className="text-lg font-bold text-slate-900">{selectedActivity?.title || '加载中...'}</h1>
                        <span className="material-symbols-outlined text-slate-400">expand_more</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">送礼人姓名</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                        <input
                          value={giverName}
                          onChange={(e) => setGiverName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                          placeholder="输入姓名"
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700">随礼金额</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold">payments</span>
                        <div className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-primary/20 rounded-xl text-3xl font-bold text-slate-900 flex items-center">
                          ¥{amount}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map(key => (
                        <button
                          key={key}
                          onClick={() => handleKeypadPress(key)}
                          className="h-14 bg-slate-100 hover:bg-slate-200 rounded-lg text-xl font-semibold flex items-center justify-center active:scale-95 transition-transform"
                        >
                          {key === 'backspace' ? (
                            <span className="material-symbols-outlined text-slate-500">backspace</span>
                          ) : key}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col items-center text-center">
                      <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <span className="material-symbols-outlined text-4xl">payments</span>
                      </div>
                      <h4 className="text-4xl font-black text-slate-900">¥{selectedRecord.amount.toLocaleString()}</h4>
                      <p className="text-slate-400 text-sm mt-1">随礼金额</p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                            <span className="material-symbols-outlined">person</span>
                          </div>
                          <span className="text-slate-500 font-medium">送礼人</span>
                        </div>
                        <span className="font-bold text-slate-900">{selectedRecord.giverName}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                            <span className="material-symbols-outlined">event_note</span>
                          </div>
                          <span className="text-slate-500 font-medium">所属活动</span>
                        </div>
                        <span className="font-bold text-slate-900">{selectedRecord.activityTitle}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
                            <span className="material-symbols-outlined">schedule</span>
                          </div>
                          <span className="text-slate-500 font-medium">日期</span>
                        </div>
                        <span className="font-bold text-slate-900">
                          {new Date(selectedRecord.timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isEditingInDetail && (
                <div className="p-6 border-t border-slate-100">
                  <button
                    onClick={handleSaveRecord}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                  >
                    保存修改
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Activity Picker Modal */}
      <AnimatePresence>
        {isActivityPickerOpen && (
          <div className="fixed inset-0 z-[9995] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsActivityPickerOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">选择活动</h3>
                <button
                  onClick={() => setIsActivityPickerOpen(false)}
                  className="size-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-6">
                {activities.map(activity => (
                  <div
                    key={activity.id}
                    onClick={() => {
                      setSelectedActivity(activity);
                      setIsActivityPickerOpen(false);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${selectedActivity?.id === activity.id ? 'bg-primary/5 border-primary text-primary' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <span className="font-semibold">{activity.title}</span>
                    {selectedActivity?.id === activity.id && (
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => setIsAddingNewActivity(true)}
                  className="w-full p-4 rounded-xl border border-dashed border-primary/40 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>新增活动</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Activity Dialog */}
      <AnimatePresence>
        {isAddingNewActivity && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingNewActivity(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-4">创建新活动</h3>
              <input
                autoFocus
                value={newActivityTitle}
                onChange={(e) => setNewActivityTitle(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none mb-6"
                placeholder="例如：小明婚礼"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddingNewActivity(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddNewActivity}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 transition-colors"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
