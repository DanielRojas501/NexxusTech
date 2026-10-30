import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getSubject } from '@/data/subjects';
import { LIVE_PROBLEMS } from '@/data/liveProblems';
import { SIMS } from '@/components/sims/registry';
import { useAuth } from '@/lib/AuthContext';
import { completeModuleExercise, awardXP, getSubjectDone } from '@/lib/progress';
import SubjectHeader from '@/components/subject/SubjectHeader';
import ModuleLesson from '@/components/subject/ModuleLesson';
import Syllabus from '@/components/subject/Syllabus';
import SkillTree from '@/components/subject/SkillTree';
import LiveProblem from '@/components/problems/LiveProblem';
import ProfeBot from '@/components/tutor/ProfeBot';
import ToolsHUD from '@/components/hud/ToolsHUD';
import TheoryPanel from '@/components/sims/TheoryPanel';
import EvalConfigPanel from '@/components/subject/EvalConfigPanel';

const trigger = 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4';

export default function Subject() {
  const { id } = useParams();
  const { user, checkUserAuth } = useAuth();
  const [done, setDone] = useState(0);
  const subject = getSubject(id);

  useEffect(() => {
    if (user?.id && subject) getSubjectDone(user.id, subject.id).then(setDone).catch(() => {});
  }, [user?.id, subject?.id]);

  if (!subject) {
    return (
      <div className="panel py-20 text-center">
        <p className="text-muted-foreground">No encontramos esta materia.</p>
        <Link to="/" className="text-primary text-sm mt-3 inline-block">Volver al catálogo</Link>
      </div>
    );
  }

  const Sim = subject.sim && SIMS[subject.sim];
  const live = LIVE_PROBLEMS.find((p) => p.subject === subject.id);

  const handleExerciseCorrect = async (moduleIndex) => {
    if (!user) return;
    try {
      const total = subject.modules[moduleIndex].exercises.length;
      await completeModuleExercise(user.id, subject.id, moduleIndex, total);
      await awardXP(15);
      await checkUserAuth();
      getSubjectDone(user.id, subject.id).then(setDone).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <SubjectHeader subject={subject} />
      <Tabs defaultValue="lecciones">
        <TabsList className="bg-card/60 border border-border/60 p-1 h-auto flex-wrap justify-start rounded-xl">
          <TabsTrigger value="lecciones" className={trigger}>Lecciones</TabsTrigger>
          {Sim && <TabsTrigger value="simulador" className={trigger}>Simulador</TabsTrigger>}
          {live && <TabsTrigger value="vivo" className={trigger}>Problema en vivo</TabsTrigger>}
          <TabsTrigger value="ruta" className={trigger}>Ruta</TabsTrigger>
          <TabsTrigger value="temario" className={trigger}>Temario</TabsTrigger>
          <TabsTrigger value="criterio" className={trigger}>Criterio del profe</TabsTrigger>
        </TabsList>
        <TabsContent value="lecciones" className="mt-6 space-y-6">
          {subject.modules.map((m, i) => <ModuleLesson key={m.title} module={m} index={i} subjectName={subject.name} onExerciseCorrect={handleExerciseCorrect} />)}
        </TabsContent>
        {Sim && (
          <TabsContent value="simulador" className="mt-6">
            <div className="grid xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
              <Sim />
              <TheoryPanel theoryKey={subject.sim} />
            </div>
          </TabsContent>
        )}
        {live && <TabsContent value="vivo" className="mt-6"><LiveProblem problem={live} /></TabsContent>}
        <TabsContent value="ruta" className="mt-6"><SkillTree subject={subject} done={done} /></TabsContent>
        <TabsContent value="temario" className="mt-6"><Syllabus subject={subject} /></TabsContent>
        <TabsContent value="criterio" className="mt-6"><EvalConfigPanel subject={subject} /></TabsContent>
      </Tabs>
      <ProfeBot context={`Materia: ${subject.name}. Módulos: ${subject.modules.map((m) => m.title).join('; ')}`} />
      <ToolsHUD />
    </div>
  );
}