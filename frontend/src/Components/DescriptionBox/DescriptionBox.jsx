import React from 'react'
import './DescriptionBox.css'

const DescriptionBox = () => {
    return (
        <div className="descriptionbox">
            <div className="descriptionbox-navigator">
                <div className="descriptionbox-nav-box">Description</div>
                <div className="descriptionbox-nav-box fade">Reviews (122)</div>
            </div>
            <div className="descriptionbox-description">
                <p>E-commerce involves conducting trade through the internet, 
                    where individuals and businesses buy and sell items without 
                    meeting in person. It covers a range of activities, 
                    from purchasing products directly from websites 
                    to companies sourcing supplies online. 
                    This type of commerce uses digital systems for payments 
                    and relies on internet-based tools for marketing and managing orders. </p>
                    <p>
                    The convenience of shopping and trading online has significantly 
                    changed how traditional buying and selling occur, making it easier 
                    for people to access goods and services from anywhere in the world.   
                    </p>
            </div>
        </div>
    )
}

export default DescriptionBox