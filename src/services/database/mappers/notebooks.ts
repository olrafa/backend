import { NotebookEntity } from '@src/domain/entities/notebook/notebook-entity';
import { Notebook } from '../models/notebook';
import { EvaluateNotebookEntity } from '@src/domain/entities/notebook/evaluate-notebook-entity';

export const notebookModelToEntity = (notebook: Notebook): NotebookEntity => ({
  idcad: notebook.idcad,
  idvol: notebook.idvol,
  idpep: notebook.idpep,
  studentName: notebook['nome do(a) aluno(a)'],
  studentRegistration: Number(notebook['número de matrícula do(a) aluno(a)']),
  studentPrisonUnit: notebook['unidade prisional do(a) aluno(a)'],
  evaluatorName: notebook.volunteer?.nome ?? '',
  evaluatorEmail: notebook.volunteer?.['e-mail'],
  subject1: notebook['tema 1'],
  subject2: notebook['tema 2'],
  subject3: notebook['tema 3'],
  subject4: notebook['tema 4'],
  subject5: notebook['tema 5'],
  subject6: notebook['tema 6'],
  subject7: notebook['tema 7'],
  subject8: notebook['tema 8'],
  subject9: notebook['tema 9'],
  subject10: notebook['tema 10'],
  relevantContent: notebook['conteúdos relevantes'],
  a1: notebook.a1,
  a2: notebook.a2,
  a3: notebook.a3,
  a4: notebook.a4,
  a5: notebook.a5,
  a6: notebook.a6,
  a7: notebook.a7,
  a8: notebook.a8,
  a9: notebook.a9,
  a10: notebook.a10,
  a11: notebook.a11,
  a12: notebook.a12,
  a13: notebook.a13,
  conclusion: notebook['conclusão do avaliador'],
  archivesExclusion: notebook['exclusão de arquivos recebidos'] === 'SIM',
  evaluatedDate: notebook['Carimbo de data/hora'],
  reservationDate: notebook.datareserva,
  notebookDirectory: notebook.pep?.directory
});

type EvaluateNotebookModel = {
  [key in keyof Notebook]?: Notebook[key];
};

export const evaluateNotebookEntityToEvaluateNotebookModel = (
  notebook: EvaluateNotebookEntity
): EvaluateNotebookModel => ({
  idvol: notebook.idvol,
  'unidade prisional do(a) aluno(a)': notebook.studentPrisonUnit,
  'tema 1': notebook.subject1,
  'tema 2': notebook.subject2,
  'tema 3': notebook.subject3,
  'tema 4': notebook.subject4,
  'tema 5': notebook.subject5,
  'tema 6': notebook.subject6,
  'tema 7': notebook.subject7,
  'tema 8': notebook.subject8,
  'tema 9': notebook.subject9,
  'tema 10': notebook.subject10,
  'conteúdos relevantes': notebook.relevantContent,
  a1: notebook.a1,
  a2: notebook.a2,
  a3: notebook.a3,
  a4: notebook.a4,
  a5: notebook.a5,
  a6: notebook.a6,
  a7: notebook.a7,
  a8: notebook.a8,
  a9: notebook.a9,
  a10: notebook.a10,
  a11: notebook.a11,
  a12: notebook.a12,
  a13: notebook.a13,
  'conclusão do avaliador': notebook.conclusion,
  'exclusão de arquivos recebidos': notebook.archivesExclusion ? 'SIM' : 'NÃO',
  'Carimbo de data/hora': new Date()
});
