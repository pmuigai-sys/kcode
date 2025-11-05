import { useParams } from "react-router-dom";

import BuilderWorkspace from "../components/builder/BuilderWorkspace";

const BuilderPage = () => {
  const { projectId } = useParams();

  return <BuilderWorkspace projectId={projectId ?? null} />;
};

export default BuilderPage;
