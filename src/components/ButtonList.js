import React from 'react';
import { Link } from 'react-router-dom';
import './ButtonList.css';

const ButtonList = ({ setSection }) => {
  const handleButtonClick = (section) => {
    setSection(section);
  };

  return (
    <div className="button-list">
      <button onClick={() => handleButtonClick('about')} className="unstyled-button">About</button>
      <button onClick={() => handleButtonClick('contact')} className="unstyled-button">Contact</button>
    </div>
  );
};

export default ButtonList;
