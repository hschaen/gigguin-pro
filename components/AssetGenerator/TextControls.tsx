import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { TextElement } from "@/lib/canvas-utils";

interface TextControlsProps {
  dateText: TextElement;
  djNamesText: TextElement;
  onDateChange: (updates: Partial<TextElement>) => void;
  onDjNamesChange: (updates: Partial<TextElement>) => void;
}

export default function TextControls({
  dateText,
  djNamesText,
  onDateChange,
  onDjNamesChange,
}: TextControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Text Controls</h3>
        
        {/* Date Controls */}
        <div className="space-y-4 mb-6">
          <div>
            <Label htmlFor="date-text">Event Date</Label>
            <Input
              id="date-text"
              type="text"
              value={dateText.text}
              onChange={(e) => onDateChange({ text: e.target.value })}
              placeholder="July 20"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="date-size">
              Date Font Size: {dateText.fontSize}px
            </Label>
            <Slider
              id="date-size"
              min={20}
              max={100}
              step={2}
              value={[dateText.fontSize]}
              onValueChange={(value) => onDateChange({ fontSize: value[0] })}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="date-color">Date Color</Label>
            <Input
              id="date-color"
              type="color"
              value={dateText.color}
              onChange={(e) => onDateChange({ color: e.target.value })}
              className="mt-1 h-10 w-full"
            />
          </div>
        </div>
        
        {/* DJ Names Controls */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="dj-names">
              DJ Names (one per line)
            </Label>
            <Textarea
              id="dj-names"
              value={djNamesText.text}
              onChange={(e) => onDjNamesChange({ text: e.target.value })}
              placeholder="DJ Name 1&#10;DJ Name 2&#10;DJ Name 3&#10;DJ Name 4"
              rows={4}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="dj-size">
              DJ Names Font Size: {djNamesText.fontSize}px
            </Label>
            <Slider
              id="dj-size"
              min={16}
              max={60}
              step={1}
              value={[djNamesText.fontSize]}
              onValueChange={(value) => onDjNamesChange({ fontSize: value[0] })}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="dj-line-height">
              Line Spacing: {djNamesText.lineHeight || djNamesText.fontSize * 1.2}px
            </Label>
            <Slider
              id="dj-line-height"
              min={djNamesText.fontSize}
              max={djNamesText.fontSize * 2}
              step={1}
              value={[djNamesText.lineHeight || djNamesText.fontSize * 1.2]}
              onValueChange={(value) => onDjNamesChange({ lineHeight: value[0] })}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="dj-color">DJ Names Color</Label>
            <Input
              id="dj-color"
              type="color"
              value={djNamesText.color}
              onChange={(e) => onDjNamesChange({ color: e.target.value })}
              className="mt-1 h-10 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}