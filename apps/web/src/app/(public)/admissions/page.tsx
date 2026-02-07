"use client"

import { useState } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

export default function AdmissionEnquiryPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    parent_name: "",
    email: "",
    phone: "",
    student_name: "",
    grade_interested: "",
    academic_year: "2024-2025",
    source: "website",
    notes: "",
    tenant_id: "78805244-6338-4e89-a359-994c502b661d" // TODO: Fetch from headers/domain or config
  })

  // Hardcoded for MVP public form, ideally needs dynamic resolution or public config endpoint
  // const tenantId = "78805244-6338-4e89-a359-994c502b661d" 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await apiClient("/public/admissions/enquiry", {
        method: "POST",
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setSuccess(true)
        setFormData({
            parent_name: "",
            email: "",
            phone: "",
            student_name: "",
            grade_interested: "",
            academic_year: "2024-2025",
            source: "website",
            notes: "",
            tenant_id: formData.tenant_id
        })
      } else {
        const err = await res.text()
        alert(err || "Failed to submit enquiry")
      }
    } catch (error) {
      console.error(error)
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto py-20 px-4 max-w-2xl text-center space-y-6">
        <Card className="p-8 border-green-200 bg-green-50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl text-green-700">Enquiry Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-green-800">
              Thank you for your interest in our school. <br/>
              Our admissions team has received your details and will contact you shortly.
            </p>
            <Button onClick={() => setSuccess(false)}>Submit Another Enquiry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="text-center mb-10 space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Apply for Admission
        </h1>
        <p className="text-xl text-muted-foreground">
          Start your child's journey with us. Fill out the form below to get in touch.
        </p>
      </div>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Admission Enquiry Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Parent / Guardian Details</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="John Doe"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({...formData, parent_name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    type="tel"
                    placeholder="+1 234 567 890"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input 
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Student Details</h3>
              
              <div className="space-y-2">
                <Label>Student's Full Name</Label>
                <Input 
                  placeholder="Jane Doe"
                  value={formData.student_name}
                  onChange={(e) => setFormData({...formData, student_name: e.target.value})}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade Interested</Label>
                  <Select 
                    value={formData.grade_interested} 
                    onValueChange={(val) => setFormData({...formData, grade_interested: val})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">Kindergarten</SelectItem>
                      <SelectItem value="1">Grade 1</SelectItem>
                      <SelectItem value="2">Grade 2</SelectItem>
                      <SelectItem value="3">Grade 3</SelectItem>
                      <SelectItem value="4">Grade 4</SelectItem>
                      <SelectItem value="5">Grade 5</SelectItem>
                      <SelectItem value="6">Grade 6</SelectItem>
                      <SelectItem value="7">Grade 7</SelectItem>
                      <SelectItem value="8">Grade 8</SelectItem>
                      <SelectItem value="9">Grade 9</SelectItem>
                      <SelectItem value="10">Grade 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select 
                    value={formData.academic_year} 
                    onValueChange={(val) => setFormData({...formData, academic_year: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea 
                placeholder="Any specific questions or requirements..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Enquiry"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
