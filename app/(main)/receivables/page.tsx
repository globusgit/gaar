"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

export default function ReceivablesPage() {
  const router = useRouter()

  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const limit = 10

  const fetchData = async () => {
    const orgId = localStorage.getItem("orgId")

    const res = await fetch(
      `/api/receivable?page=${page}&limit=${limit}&search=${search}&orgId=${orgId}`
    )
    const result = await res.json()

    setData(result.data)
    setTotal(result.total)
  }

  useEffect(() => {
    fetchData()
  }, [page, search])

  return (
    <div className="p-4">

      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-300 to-cyan-900 text-white text-center py-2 rounded-md">
        <h1 className="text-lg font-semibold">Receivables</h1>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between mt-4">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3"
        />

        <div className="flex gap-2">
          <Button>Export</Button>
          <Button onClick={() => router.push("/receivables/create")}>
            Add Receivable
          </Button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mt-4 border">
        <thead>
          <tr className="bg-gray-100">
            <th></th>
            <th>Description</th>
            <th>Amount</th>
            <th>Vertical</th>
            <th>Status</th>
            <th>Due Date</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item: any) => (
            <tr key={item._id} className="border-t">
              <td>
                <Pencil
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/receivables/edit/${item._id}`)
                  }
                />
              </td>
              <td>{item.description}</td>
              <td>{item.amount}</td>
              <td>{item.vertical}</td>
              <td>{item.status}</td>
              <td>
                {item.dueDate?.substring(0, 10)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-center mt-4 gap-2">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </Button>
        <span>{page}</span>
        <Button
          disabled={page * limit >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}