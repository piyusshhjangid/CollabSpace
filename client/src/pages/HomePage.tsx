import Badge from "../components/Badge";
import { Button } from "../components/Button";

export default function HomePage() {
  const handleClick = (message: string) => {
    console.log(message);
  };
  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-2/3 rounded-3xl bg-gray-50 items-center p-5 gap-5 border border-zinc-300">
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-bold text-3xl text-gray-900">
            Welcome To CollabSpace
          </h1>
          <p className="text-lg text-gray-600">
            Your Collaborative Workspace to build amazing things together.
          </p>
        </div>
        <div className="flex gap-5">
          <Button variant="primary" disabled={false} onClick={() => handleClick("Started")}>
            Get Started
          </Button>
          <Button variant="secondary" disabled={false} onClick={() => handleClick("More")}>
            Learn More
          </Button>
          <Button variant="danger" disabled={false} onClick={() => handleClick("Delete")}>
            Delete
          </Button>
        </div>
        <div className="flex gap-3">
          <Badge color="green">Active</Badge>
          <Badge color="blue">In Progress</Badge>
          <Badge color="yellow">Pending</Badge>
          <Badge color="red">High Demand</Badge>
        </div>
      </div>
    </div>
  );
}
