import {
  Form,
  Outlet,
  redirect,
  useFetcher,
  useNavigate,
  useSearchParams,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import type { Route } from "../../+types/root";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import DataRequestModal from "~/components/DataRequestModal";
import { CheckIcon, HashIcon, PoundSterlingIcon } from "lucide-react";
import RequestCard from "../../components/RequestCard";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return redirect("/");
  }
  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        acc[name] = decodeURIComponent(value);
      }
      return acc;
    },
    {} as Record<string, string>
  );
  try {
    const { data } = await supabase
      .from("request")
      .select(`*, user(email), organization!org_id(name), base!base_id(name)`)
      .eq("is_denied", false);
    // console.log("test: ", data);
    const { data: allUsersData, error: allUsersError } = await supabase.from("user").select();
    const { data: allOrgsData, error: allOrgsError } = await supabase.from("organization").select();
    return { data, allUsersData,  allOrgsData };
  } catch (error) {
    console.error("Error: ", error);
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const _action = formData.get("submit");
  const base_id = formData.get("base_id") as string;
  const user_id = formData.get("user_id") as string;

  // console.log(formData)

  if(_action === "neworg-submit"){
    const { data: newOrgData, error: newOrgError} = await supabase.from("organization").insert({"name": formData.get("name"), "base_id": base_id, "user_id": user_id, "type": "SUPPORT"}).select("id")
    // console.log(newOrgError)
    if(!newOrgError){
      const { data: deleteRequestData, error: deleteRequestError} = await supabase.from("request").delete().eq("id", formData.get("request_id"))
      // console.log(deleteRequestError)
      return {deleteRequestData}
    }
    return {newOrgData}
  }
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { data: requests, allUsersData, allOrgsData } = loaderData;
  const [requestList, setRequestList] = useState(requests);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequestData, setSelectedRequestData] = useState();
  const orgFetcher = useFetcher();
  const navigate = useNavigate();
  // const newOrgs = requests.filter((request: {organization: {}}) => request.organization === null)
  // console.log(requests)

  const approve = async (
    userId: string,
    entId: { id: string; ent: string },
    requestId: string
  ) => {
    try {
      let updateData = null;
      let updateError = null;

      if (entId.ent === "org") {
        const { data: orgData, error: orgError } = await supabase
          .from("organization")
          .update({ user_id: userId })
          .eq("id", entId.id);

        updateData = orgData;
        updateError = orgError;
      } else if (entId.ent === "base") {
        const { data: baseData, error: baseError } = await supabase
          .from("base")
          .update({ user_id: userId })
          .eq("id", entId.id);

        updateData = baseData;
        updateError = baseError;
      } else {
        // Handle unexpected entity type
        console.error("Unknown entity type:", entId.ent);
        return;
      }

      // Check if update was successful before proceeding
      if (updateError) {
        console.error("Error updating entity:", updateError);
        return { data: null, error: updateError };
      }

      // Only delete the request if the update was successful
      const { data: result, error: deleteError } = await supabase
        .from("request")
        .delete()
        .eq("id", requestId);

      if (deleteError) {
        console.error("Error deleting request:", deleteError);
        return { data: updateData, error: deleteError };
      }

      // Update successful and request deleted - update local state
      setRequestList((prev) =>
        prev.filter((request) => request.id !== requestId)
      );

      // console.log("Update data:", updateData);
      // console.log("Delete result:", result);

      return redirect("/");
    } catch (error) {
      console.error("Error approving request:", error);
      return { data: null, error };
    }
  };

  const deny = async (requestId) => {
    try {
      const { data, error } = await supabase
        .from("request")
        .delete()
        .eq("id", requestId);

      if (!error) {
        // Remove the denied request from local state
        setRequestList((prev) =>
          prev.filter((request) => request.id !== requestId)
        );
      }
    } catch (error) {
      console.error("Error denying request:", error);
    }
  };

 useEffect(() => {
  setRequestList(
    requests
  );
}, [requests]);

  function handleModal(id: string) {
    // orgFetcher.load()
    setShowRequestModal(true);
    setSelectedRequestData(
      requestList.filter((request) => request.id === id)[0]
    );
    navigate(`org/request?id=${id}`);
  }

  function handleOrgApprove(data: any){

  }

  return (
    <div className="w-full h-screen p-6">
      {/* <Card className="">
        <CardHeader>Requests to update Org/Base Data</CardHeader>
        <CardContent>
          {requestList.length > 0 ? <table className="w-full  bg-gray-200 rounded-t-lg">
            <thead className="text-left">
              <tr>
                <th className="pl-2">Email</th>
                <th>Organization/Base</th>
                <th>Data</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody className="text-left">
              {requestList &&
                requestList.map((request, index) => (
                  <tr key={index} className="bg-white border">
                    <td className="pl-2">{request.user.email}</td>
                    <td>{request.organization?.name ?? request.base?.name}</td>
                    <td>
                      <button
                        type="button"
                        className="p-1 m-1 border rounded-lg shadow-md"
                        onClick={() => handleModal(request.id)}
                      >
                        {/* {Object.entries(request.data).length - 2 + " item"} */}
                      {/* </button>
                    </td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="space-x-2">
                        <Button
                          className="bg-green-500"
                          onClick={() =>
                            approve(
                              request.user_id,
                              {
                                id: request.org_id ?? request.base_id,
                                ent: request.org_id ? "org" : "base",
                              },
                              request.id
                            )
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          variant={"destructive"}
                          onClick={() => deny(request.id)}
                        >
                          Deny
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          :
          <p className="italic text-gray-400 text-center">No requests</p>}
        </CardContent> *
      </Card> */}
      <div className="flex w-full">
        <Card className="border border-border shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <CardContent>
            <div className="inline-flex items-center gap-3">
              <div className="rounded-full p-2 text-gray-500 bg-gray-300">
                <HashIcon />
              </div>
              Total Requests
            </div>
            <p className="text-center text-xl">{requests.length}</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col gap-4 items-center mt-4">
      {requestList.map(request => <RequestCard request={request} allUsers={allUsersData} allOrgs={allOrgsData}/>)}
      </div>
      {/* <Card className="mt-4">
        <CardHeader>
          Request to create new org
        </CardHeader>
        <CardContent>
                {newOrgs.length > 0 ? <table className="w-full bg-gray-200 rounded-t-lg">
                  <thead>
                    <tr className="text-left">
                      <th className="pl-2">Email</th>
                      <th>Base</th>
                      <th>Organization</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newOrgs.map(item => 
                    <tr>
                      <td>{item.user.email}</td>
                      <td>{item.base.name}</td>
                      <td>{item.data.newOrg}</td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>
                        <div>
                          <Form method="POST">

                          <input type='hidden' name="name" value={item.data.newOrg}/>
                          <input type='hidden' name="base_id" value={item.base_id}/>
                          <input type="hidden" name="user_id" value={item.user_id} />
                          <input type="hidden" name="request_id" value={item.id}/>
                          <Button variant={"default"} 
                            type="submit"
                            name="submit"
                            value="neworg-submit"
                            className="bg-white text-green-600 border-green-400 border h-6 w-6 hover:bg-green-200 "><CheckIcon style={{width: "14", height: "14"}}/></Button>
                          </Form>
                        </div>
                        </td>
                    </tr>)}
                  </tbody>
                </table>
                :
                <p className="italic text-center text-gray-400">No requests</p>}
        </CardContent>
      </Card> */}
      {/* {showRequestModal && (
        <DataRequestModal requestData={selectedRequestData} existingData={[]}></DataRequestModal>
      )} */}
      <Outlet />
    </div>
  );
}
