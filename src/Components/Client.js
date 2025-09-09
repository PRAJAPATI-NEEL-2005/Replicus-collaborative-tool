import React from "react";
import Avatar from "react-avatar";

const Client = ({ username }) => {
  return (
    <div className="d-flex align-items-center mb-2">
      <Avatar
        name={username}
        size="35"
        round={true}
        textSizeRatio={2}
        className="me-2"
      />
      <span className="text-secondary">{username}</span>
    </div>
  );
};

export default Client;
