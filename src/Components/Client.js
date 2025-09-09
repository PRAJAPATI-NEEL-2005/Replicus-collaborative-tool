import React from 'react'
import Avatar from 'react-avatar'
const Client = ({key,username}) => {
  return (
    <div className="client">
      <div className="clientwrap">
        <span className="clienticon"><Avatar name={username} size={50} round="15px" /></span>
        <span className="clientname">{username}</span>
      </div>
    </div>
  )
}

export default Client
