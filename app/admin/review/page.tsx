import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function AdminReviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  
  // NOTE: For a real app, verify the user is actually an admin here.
  const pendingRequests = await prisma.clearanceRequest.findMany({
    where: { status: "pending" },
    include: { scan: true },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Review Queue</h1>
      {pendingRequests.length === 0 ? (
        <p className="text-gray-500">No pending scans in the queue.</p>
      ) : (
        <div className="space-y-6">
          {pendingRequests.map(req => {
            const photoIds = req.scan.photoIds as { front?: string, back?: string } | null;
            return (
              <div key={req.id} className="border p-4 rounded-xl shadow-sm bg-white flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-lg">Request #{req.id.slice(-6)}</h2>
                    <p className="text-sm text-gray-500">Reason: {req.reason}</p>
                    <p className="text-xs text-gray-400">Scan ID: {req.scanId} - User: {req.scan.userId}</p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">Pending</span>
                </div>
                
                <div className="flex gap-4">
                  {photoIds?.front && (
                    <div className="bg-gray-100 h-32 w-24 flex items-center justify-center rounded">Front Photo</div>
                  )}
                  {photoIds?.back && (
                    <div className="bg-gray-100 h-32 w-24 flex items-center justify-center rounded">Back Photo</div>
                  )}
                </div>

                <form className="flex flex-col gap-2 border-t pt-4" action={async (formData) => {
                  "use server"
                  const id = formData.get("id") as string;
                  const action = formData.get("action") as string;
                  await prisma.clearanceRequest.update({
                    where: { id },
                    data: { status: action === "approve" ? "cleared" : "rejected", reviewedAt: new Date(), reviewedBy: "admin" }
                  });
                  // NOTE: if approved, we would also copy this into the Product catalog.
                }}>
                  <input type="hidden" name="id" value={req.id} />
                  <div className="flex gap-4">
                    <button type="submit" name="action" value="approve" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium">Approve</button>
                    <button type="submit" name="action" value="reject" className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium">Reject</button>
                  </div>
                </form>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

