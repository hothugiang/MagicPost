import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loading from "../helpers/Loading";
import service from "../helpers/service";
import { Button, DatePicker, Form, Input } from "antd";

export default function InviteEmployee() {
  const [form] = Form.useForm();
  const [data, setData] = useState([]);

  const [roleAPI, setRoleAPI] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    service.get("/users/me").then((res) => {
      setData(res.data.results);
      if (res.data.results.role === "EXCHANGE_MANAGER") {
        setRoleAPI("ex-manager");
      } else if (res.data.results.role === "GATHER_MANAGER") {
        setRoleAPI("gth-manager");
      }
      setLoading(false);
    });
  }, []);

  const onFinish = () => {
    const { email, fullName, departmentId, dob } = form.getFieldsValue();
    const formData = new FormData();
    formData.append("email", email);
    formData.append("fullName", fullName);
    formData.append("departmentId", departmentId);
    formData.append("dob", dob.format("DD-MM-YYYY"));

    setLoading(true);

    service
      .post("/" + roleAPI + "/invite", formData)
      .then((res) => {
        setLoading(false);
        if (res.data.status === 201) {
          toast.success(res.data.message);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        setLoading(false);
        toast.error(err.response.data.message);
      });
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      {loading && <Loading />}
      <div className="flex h-full w-full flex-col p-8 pl-20">
        <div className="text-3xl font-bold">Add employee</div>
        <div className="w-[60%] self-center">
          <div className="mt-4 flex gap-4">
            <Form.Item
              className="w-[50%]"
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter an email" },
                {
                  type: "email",
                  message: "Please enter a valid email",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </div>
          <div className="flex gap-4">
            <Form.Item
              className="w-[50%]"
              name="fullName"
              label="Full Name"
              rules={[{ required: true, message: "Please enter a full name" }]}
            >
              <Input />
            </Form.Item>
          </div>
          <div className="mt-4">
            <Form.Item
              name="dob"
              label="Date of Birth"
              rules={[
                {
                  type: "object",
                  required: true,
                  message: "Please select a date of birth",
                },
              ]}
            >
              <DatePicker
                className="w-64"
                format="DD/MM/YYYY"
                disabledDate={(current) =>
                  current && current.valueOf() > Date.now()
                }
              />
            </Form.Item>
          </div>
          <div className="mt-4">
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
}