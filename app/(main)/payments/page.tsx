"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Pencil } from "lucide-react"

export default function PaymentList() {
  const router = useRouter()

  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const limit = 10

  const fetchData = async () => {
    const orgId = localStorage.getItem("orgId")

    const res = await fetch(
      `/api/payment?search=${search}&page=${page}&limit=${limit}&orgId=${orgId}`
    )

    const json = await res.json()
    setData(json.data)
    setTotal(json.total)
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

      {/* Controls */}
      <div className="flex justify-between p-4">
        <Input
          placeholder="Search..."
          className="w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2">
          <Button>Export Excel</Button>
          <Button onClick={() => router.push("/payments/create")}>
            Add Payment
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Edit</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested By</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((item: any) => (
            <TableRow key={item._id}>
              <TableCell>
                <Pencil
                  className="cursor-pointer"
                  onClick={() => router.push(`/payments/edit/${item._id}`)}
                />
              </TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>{item.amount}</TableCell>
              <TableCell>{item.status}</TableCell>
              <TableCell>{item.requestedBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-center gap-4 p-4">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</Button>
        <span>{page}</span>
        <Button disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  )
}