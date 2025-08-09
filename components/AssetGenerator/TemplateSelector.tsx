import Image from "next/image";
import { Label } from "@/components/ui/label";

export interface Template {
  id: string;
  name: string;
  path: string;
  aspectRatio: string;
}

const templates: Template[] = [
  {
    id: "standard",
    name: "Standard",
    path: "/assets/sushi-sundays-lineup-no-bus-template.png",
    aspectRatio: "1:1",
  },
  {
    id: "portrait",
    name: "Portrait (4:5)",
    path: "/assets/sushi-sundays-lineup-no-bus 4_5 template.png",
    aspectRatio: "4:5",
  },
  {
    id: "story",
    name: "Story (9:16)",
    path: "/assets/sushi-sundays-lineup-no-bus 9_16 template.png",
    aspectRatio: "9:16",
  },
];

interface TemplateSelectorProps {
  selectedTemplate: Template;
  onTemplateChange: (template: Template) => void;
}

export default function TemplateSelector({
  selectedTemplate,
  onTemplateChange,
}: TemplateSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <Label className="text-lg font-semibold mb-4 block">
        Select Template
      </Label>
      <div className="grid grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template)}
            className={`relative border-2 rounded-lg overflow-hidden transition-all ${
              selectedTemplate.id === template.id
                ? "border-blue-500 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="aspect-square relative">
              <Image
                src={template.path}
                alt={template.name}
                fill
                className="object-contain p-2"
              />
            </div>
            <div className="p-2 text-sm font-medium">
              {template.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { templates };