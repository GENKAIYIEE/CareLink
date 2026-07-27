import { prisma } from '@/lib/prisma';
import EditProgramForm from './EditProgramForm';
import { notFound } from 'next/navigation';

export default async function EditProgramPage({ params }: { params: { id: string } }) {
  const program = await prisma.benefitProgram.findUnique({
    where: { id: params.id },
  });

  if (!program) {
    notFound();
  }

  // Format date for the input type="date"
  const formattedDate = new Date(program.distributionDate).toISOString().split('T')[0];

  return <EditProgramForm program={{ ...program, formattedDate }} />;
}
