import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { id: communityId, memberId } = await params;
        const { reason } = await request.json();

        // Vérifier que l'utilisateur est le créateur de la communauté
        const community = await prisma.community.findUnique({
            where: { id: parseInt(communityId) }
        });

        if (community.creator_id !== parseInt(session.user.id)) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        await prisma.$transaction([
            // Supprimer des contributeurs si présent
            prisma.community_contributors.deleteMany({
                where: {
                    community_id: parseInt(communityId),
                    contributor_id: parseInt(memberId)
                }
            }),
            // Supprimer des apprenants si présent
            prisma.community_learners.deleteMany({
                where: {
                    community_id: parseInt(communityId),
                    learner_id: parseInt(memberId)
                }
            }),
            // Ajouter aux bannis
            prisma.community_bans.create({
                data: {
                    community_id: parseInt(communityId),
                    user_id: parseInt(memberId),
                    reason
                }
            })
        ]);

        return NextResponse.json({ message: "Membre banni avec succès" });
    } catch (error) {
        console.log("Erreur:", error.stack);
        return NextResponse.json(
            { error: "Erreur lors du bannissement du membre" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
} 