"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import PageHeader from "@/app/_components/PageHeader"

export default function EditFR() {
  const { frNo } = useParams()
  const router = useRouter()

  const [data, setData] = useState<any>({})


  useEffect(() => {
    fetch(`/api/fund-request/${frNo}`)
      .then((res) => res.json())
      .then(setData)
  }, [])

  const updateStatus = async (type: string) => {
    const user = localStorage.getItem("user")

    let update: any = {}

    if (type === "approve") {
      update = {
        isApproved: true,
        approvedBy: user,
        status: "Approved",
      }
    }

    if (type === "authorize") {
      update = {
        isAuthorized: true,
        authorizedBy: user,
        status: "Authorized",
        state: "Authorized",
      }
    }

    await fetch(`/api/fund-request/${frNo}`, {
      method: "PUT",
      body: JSON.stringify(update),
    })

    router.push("/fund-request")
  }

  return (
    <div className="py-2">
      <PageHeader title="Edit Fund Request" />

      <div className="p-4">
        <p>FR No: {data.frNo}</p>
        <p>Status: {data.status}</p>

        {data.status === "Requested" && (
          <Button onClick={() => updateStatus("approve")}>
            Approve
          </Button>
        )}

        {data.status === "Approved" && (
          <Button onClick={() => updateStatus("authorize")}>
            Authorize
          </Button>
        )}
      </div>
    </div>
  )
}