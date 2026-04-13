"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"

export default function EmployeeList() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const router = useRouter()

  const fetchData = async () => {
    const orgId = localStorage.getItem("orgId")

    const res = await fetch(
      `/api/employee/search?search=${search}&page=${page}&limit=10&orgId=${orgId}`
    )

    const json = await res.json()
    setData(json.data)
    setTotal(json.total)
  }

  useEffect(() => {
    fetchData()
  }, [search, page])

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* ✅ Title Bar (Enterprise Style) */}
      <div className="bg-gradient-to-r from-cyan-300 to-cyan-900 text-white text-center py-2 rounded-md">
        <h1 className="text-lg font-semibold">Employees</h1>
      </div>

       
      

      {/* ✅ Controls */}
      <div className="flex justify-between mt-4">
        <input
          placeholder="Search employees..."
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          className="border px-4 py-2 rounded-lg w-1/3"
        />
        <div className="flex gap-2">
          <button className="border px-4 py-2 rounded-lg hover:bg-gray-50">
            Export
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            onClick={() => router.push("/employees/create")}
          >
            + Create
          </button>
        </div>
      </div>

      {/* ✅ Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        
        {/* Header */}
        <div className="grid grid-cols-[60px_80px_1fr_120px_1.5fr_120px_140px] gap-4 px-6 py-3 bg-gray-50 border-b text-sm font-semibold text-gray-600">
          <div>Edit</div>
          <div>Photo</div>
          <div>Name</div>
          <div>Emp ID</div>
          <div>Email</div>
          <div>Phone</div>
          <div>Designation</div>
        </div>

        {/* Rows */}
        {data.map((emp) => (
          <div
            key={emp._id}
            className="grid grid-cols-[60px_80px_1fr_120px_1.5fr_120px_140px] gap-4 px-6 py-3 border-b items-center text-sm hover:bg-gray-50"
          >
            {/* ✅ Edit Icon */}
            <div>
              <Pencil
                className="w-4 h-4 text-blue-600 cursor-pointer"
                onClick={() => router.push(`/employees/edit/${emp._id}`)}
              />
            </div>

            {/* Photo */}
            <div>
              <img
            src={
              emp.photo
                ? `/api/files/employees/${emp.photo}`
                : "/default-avatar.jpg"
              }
              onError={(e) => {
                e.currentTarget.src = "/default-avatar.jpg"
              }}
              className="w-10 h-10 rounded-full object-cover border"
            />
            </div>

            <div className="font-medium text-gray-800">{emp.name}</div>
            <div>{emp.empId}</div>
            <div className="truncate">{emp.email}</div>
            <div>{emp.phone}</div>
            <div>{emp.designation}</div>
          </div>
        ))}

        {data.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No employees found
          </div>
        )}
      </div>

      {/* ✅ Pagination */}
      <div className="mt-4 flex justify-end items-center gap-3">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-sm font-medium">{page}</span>

        <button
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded"
        >
          Next
        </button>
      </div>
    </div>
  )
}