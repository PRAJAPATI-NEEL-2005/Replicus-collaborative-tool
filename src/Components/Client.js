import React from "react";
import Avatar from "react-avatar";

const Client = ({ username, isSelf }) => {
  return (
    <div className="d-flex align-items-center mb-2">
      <Avatar
        name={username} // The avatar now only sees "John"
        size="35"
        round={true}
        textSizeRatio={2}
        className="me-2"
      />
      <span className="text-secondary">
        {username}{isSelf ? " (You)" : ""} {/* Appends "(You)" only in the UI text */}
      </span>
    </div>
  );
};
export default Client;
