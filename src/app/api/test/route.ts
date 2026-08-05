import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      include: {
        sessions: true,
        payments: true
      }
    });

    const normalize = (n: string) => (n || "").trim().toLowerCase().replace(/\s+/g, ' ');
    const groups: { [key: string]: typeof patients } = {};
    const mergedNames = [];

    // Simple clustering: O(N^2)
    const visited = new Set<string>();
    
    for (let i = 0; i < patients.length; i++) {
      if (visited.has(patients[i].id)) continue;
      
      const cluster = [patients[i]];
      visited.add(patients[i].id);
      
      const nameI = normalize(patients[i].name);
      
      for (let j = i + 1; j < patients.length; j++) {
        if (visited.has(patients[j].id)) continue;
        
        const nameJ = normalize(patients[j].name);
        
        // If names are very similar (one contains the other and length difference is just missing a second last name)
        // or they share the first two words.
        const wordsI = nameI.split(' ');
        const wordsJ = nameJ.split(' ');
        
        const firstTwoI = wordsI.slice(0, 2).join(' ');
        const firstTwoJ = wordsJ.slice(0, 2).join(' ');
        
        // Match if one string includes the other, and they are > 5 chars (to avoid matching short names)
        if ((nameI.includes(nameJ) || nameJ.includes(nameI)) && nameI.length > 5 && nameJ.length > 5) {
          // If it's a match:
          cluster.push(patients[j]);
          visited.add(patients[j].id);
        } else if (firstTwoI === firstTwoJ && firstTwoI.length > 3) {
          cluster.push(patients[j]);
          visited.add(patients[j].id);
        }
      }
      
      if (cluster.length > 1) {
        // Sort by amount of data (crude: number of non-null fields + number of sessions)
        cluster.sort((a, b) => {
          const countA = Object.values(a).filter(v => v !== null && v !== '' && v !== false).length + a.sessions.length;
          const countB = Object.values(b).filter(v => v !== null && v !== '' && v !== false).length + b.sessions.length;
          return countB - countA;
        });

        const mainPatient = cluster[0];
        const duplicates = cluster.slice(1);

        // Merge medicoTratante
        const therapists = new Set<string>();
        if (mainPatient.medicoTratante) {
          mainPatient.medicoTratante.split('-').map((t: string) => t.trim().toLowerCase()).forEach((t: string) => {
            if (t) therapists.add(t.charAt(0).toUpperCase() + t.slice(1));
          });
        }
        
        for (const dup of duplicates) {
          if (dup.medicoTratante) {
            dup.medicoTratante.split('-').map((t: string) => t.trim().toLowerCase()).forEach((t: string) => {
              if (t) therapists.add(t.charAt(0).toUpperCase() + t.slice(1));
            });
          }
        }

        const mergedTherapists = Array.from(therapists).join(' - ');

        // Update main patient with therapists if changed
        if (mainPatient.medicoTratante !== mergedTherapists) {
          await prisma.patient.update({
            where: { id: mainPatient.id },
            data: { medicoTratante: mergedTherapists }
          });
        }

        // Redirect relations and delete duplicates
        for (const dup of duplicates) {
          // Update Sessions
          await prisma.session.updateMany({
            where: { patientId: dup.id },
            data: { patientId: mainPatient.id }
          });

          // Update Payments
          await prisma.payment.updateMany({
            where: { patientId: dup.id },
            data: { patientId: mainPatient.id }
          });

          // Delete Patient
          await prisma.patient.delete({
            where: { id: dup.id }
          });
        }

        mergedNames.push(mainPatient.name);
      }
    }

    return NextResponse.json({ success: true, merged: mergedNames });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
