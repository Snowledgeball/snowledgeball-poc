"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Image from "next/image";
import { CheckCircle, XCircle, AlertCircle, Users } from "lucide-react";

interface ReviewCreationProps {
  postId: number;
  communityId: string;
  postTitle: string;
  postContent: string;
  coverImageUrl?: string;
  authorName: string;
  authorId: number;
}

export default function ReviewCreation({
  postId,
  communityId,
  postTitle,
  postContent,
  coverImageUrl,
  authorName,
  authorId,
}: ReviewCreationProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED" | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contributorsCount, setContributorsCount] = useState(0);
  const [votesCount, setVotesCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer le nombre de contributeurs
        const contributorsResponse = await fetch(
          `/api/communities/${communityId}/contributors/count`
        );
        if (contributorsResponse.ok) {
          const contributorsData = await contributorsResponse.json();
          setContributorsCount(contributorsData.count);
        }

        // Récupérer le nombre de votes déjà soumis
        const votesResponse = await fetch(
          `/api/communities/${communityId}/posts/${postId}/reviews/count`
        );
        if (votesResponse.ok) {
          const votesData = await votesResponse.json();
          setVotesCount(votesData.count);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des statistiques:",
          error
        );
      }
    };

    fetchStats();
  }, [communityId, postId]);

  const handleSubmitReview = async () => {
    if (!decision) {
      toast.error("Veuillez choisir d'approuver ou de rejeter le post");
      return;
    }

    if (!feedback.trim()) {
      toast.error("Veuillez fournir un feedback");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/communities/${communityId}/posts/${postId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: feedback,
            status: decision,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la soumission de la révision");
      }

      toast.success("Vote soumis avec succès");
      window.location.href = `/community/${communityId}?tab=voting`;
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la soumission du vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculer le pourcentage de votes déjà soumis
  const votesPercentage =
    contributorsCount > 0
      ? Math.round((votesCount / contributorsCount) * 100)
      : 0;

  // Déterminer si le vote est crucial (proche du seuil de 50%)
  const isCrucialVote =
    contributorsCount > 0 &&
    Math.abs(votesCount - Math.ceil(contributorsCount / 2)) <= 2;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Voter sur ce post</h1>
            <span className="text-sm text-gray-500">Auteur: {authorName}</span>
          </div>

          {/* Statistiques de vote */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-800">
                Statistiques de vote
              </h3>
            </div>
            <p className="text-sm text-blue-700 mb-2">
              {votesCount} votes sur {contributorsCount} contributeurs (
              {votesPercentage}%)
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
              <div
                className="h-2.5 rounded-full bg-blue-600"
                style={{ width: `${votesPercentage}%` }}
              ></div>
            </div>
            {isCrucialVote && (
              <div className="flex items-center mt-2 text-sm text-orange-700 bg-orange-50 p-2 rounded-lg border border-orange-200">
                <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                Votre vote est crucial ! Il pourrait faire basculer la décision.
              </div>
            )}
          </div>

          {/* Contenu du post */}
          <div className="bg-white rounded-xl p-6 mb-8 border border-gray-100">
            {coverImageUrl && (
              <div className="w-full h-64 relative mb-6 rounded-lg overflow-hidden">
                <Image
                  src={`https://${coverImageUrl}`}
                  alt={postTitle}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <h2 className="text-2xl font-bold mb-4">{postTitle}</h2>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: postContent }}
            />
          </div>

          {/* Section de décision */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              Votre décision globale
            </h3>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <button
                onClick={() => setDecision("APPROVED")}
                className={`flex-1 p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                  decision === "APPROVED"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:bg-gray-100"
                }`}
              >
                <CheckCircle
                  className={`w-5 h-5 ${
                    decision === "APPROVED" ? "text-green-600" : "text-gray-400"
                  }`}
                />
                <span className="font-medium">Approuver</span>
              </button>

              <button
                onClick={() => setDecision("REJECTED")}
                className={`flex-1 p-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-colors ${
                  decision === "REJECTED"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 hover:bg-gray-100"
                }`}
              >
                <XCircle
                  className={`w-5 h-5 ${
                    decision === "REJECTED" ? "text-red-600" : "text-gray-400"
                  }`}
                />
                <span className="font-medium">Rejeter</span>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback pour l'auteur
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Expliquez votre décision et donnez des suggestions d'amélioration, que vous ayez approuvé ou rejeté le post"
                className="min-h-[150px]"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => router.push(`/community/${communityId}`)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mr-4"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={!decision || !feedback.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Soumission..." : "Soumettre mon vote"}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
