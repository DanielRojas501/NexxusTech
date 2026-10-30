import { useState } from 'react';
import ExamIntro from '@/components/exam/ExamIntro';
import ExamRunner from '@/components/exam/ExamRunner';
import ExamResults from '@/components/exam/ExamResults';
import { buildExam } from '@/data/examBank';
import { useAuth } from '@/lib/AuthContext';
import { parseNum, isClose } from '@/lib/check';
import { saveExamResult, awardXP } from '@/lib/progress';

export default function Exam() {
  const { user, checkUserAuth } = useAuth();
  const [stage, setStage] = useState('intro');
  const [config, setConfig] = useState({ minutes: 25, questions: [] });
  const [result, setResult] = useState(null);

  const start = (minutes, count) => { setConfig({ minutes, questions: buildExam(count) }); setStage('run'); };

  const finish = async (answers, timeUsed) => {
    setResult({ answers, timeUsed });
    setStage('done');
    window.scrollTo(0, 0);
    const correct = config.questions.filter((q, i) => isClose(parseNum(answers[i]), q.answer, 0.02)).length;
    if (user) {
      try {
        await saveExamResult({
          score_pct: Math.round((correct / config.questions.length) * 100),
          correct,
          total: config.questions.length,
          duration_sec: timeUsed,
          detail: { areas: config.questions.map((q) => q.area) },
        });
        await awardXP(correct * 10);
        await checkUserAuth();
      } catch (e) { console.error(e); }
    }
  };

  if (stage === 'run') return <ExamRunner questions={config.questions} minutes={config.minutes} onFinish={finish} />;
  if (stage === 'done') return <ExamResults questions={config.questions} answers={result.answers} timeUsed={result.timeUsed} onRetry={() => setStage('intro')} />;
  return <ExamIntro onStart={start} />;
}