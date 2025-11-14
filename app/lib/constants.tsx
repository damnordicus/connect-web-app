import { Database, FileUp, FolderOpen, Share2, User } from "lucide-react";

export const states = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
];

export const categories = [
  {
    type: "WING",
    color:
      "border-[#fa6257] bg-[#fa6257]/15 text-[#fa6257] hover:shadow-[#fa6257]/35",
  },
  {
    type: "GROUP",
    color:
      "border-[#fab657] bg-[#fab657]/15 text-[#fab657] hover:shadow-[#fab657]/35",
  },
  {
    type: "SQUADRON",
    color:
      "border-[#57fa5a] bg-[#57fa5a]/15 text-[#57fa5a] hover:shadow-[#57fa5a]/35",
  },
  {
    type: "AGENCY",
    color:
      "border-[#579efa] bg-[#579efa]/15 text-[#579efa] hover:shadow-[#579efa]/35",
  },
  {
    type: "SUPPORT",
    color:
      "border-[#e257fa] bg-[#e257fa]/15 text-[#e257fa] hover:shadow-[#e257fa]/35",
  },
];

type RequestType = {
  label: string;
  labelFull: string;
  color: string;
  border: string;
  iconText: string;
}

export const requests : Record<string, RequestType> = {
    "create-org": {
        label: "Create Org",
        labelFull: "Create Organization",
        color: "bg-green-600/20",
        border: "border-green-400/40",
        iconText: "text-green-600",
    },
    "org-admin": {
        label: "Org Admin",
        labelFull: "Organization Administrator",
        color: "bg-amber-600/20",
        border: "border-amber-600/40",
        iconText: "text-amber-600",
    },
    "base-admin": {
        label: "Base Admin",
        labelFull: "Base Administrator",
        color: "bg-rose-600/20",
        border: "border-rose-400/40",
        iconText: "text-rose-600",
    },
    "org-update": {
        label: "Org Update",
        labelFull: "Organization Update",
        color: "bg-sky-600/20",
        border: "border-sky-600/40",
        iconText: "text-sky-600",
    },
    "base-update": {
        label: "Base Update",
        labelFull: "Base Update",
        color: "bg-violet-600/20",
        border: "border-violet-400/40",
        iconText: "text-violet-600",
    }
};

export const REASONS = [
  "Reason 1",
  "Reason 2",
  "Reason 3",
  "Reason 4",
]

export const ADDITIONAL_FIELDS = [
  {
    name: "Upload/Download file",
    description: "Add ability to upload a file, that can be downloaded from app",
    icon: <FileUp />
  },
  {
    name: "Display Table",
    description: "Add a data table to display structured information",
    icon: <Database />
  },
  {
    name: "Contact List",
    description: "Add contact list field with contact information",
    icon: <User />
  },
  {
    name: "Social Media",
    description: "Add social media links and profiles",
    icon: <Share2 />
  },
  {
    name: "Nested Directories",
    description: "Add nested directory structure",
    icon: <FolderOpen />
  },
]