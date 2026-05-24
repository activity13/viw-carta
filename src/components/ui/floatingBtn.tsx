import { Button } from "@/components/ui/button";
export default function FloatingButton() {
  return (
    <div className="fixed bottom-4 right-4">
      <Button
        className="bg-green-700 hover:bg-green-5000 rounded-full h-14 w-14 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        size="icon"
        aria-label="Add new item"
      >
        <h1>+</h1>
      </Button>
    </div>
  );
}
