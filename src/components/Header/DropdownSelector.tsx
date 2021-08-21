import React from 'react';
import { Dropdown } from 'semantic-ui-react';
import { Link } from 'react-router-dom';


const DropdownSelector = () => {
    return (
        <Dropdown text='Applications'>
            <Dropdown.Menu style={{ height: 'auto' }}>
                <Dropdown.Item text='Secret Lottery' as={Link} to='/lottery' />
            </Dropdown.Menu>
        </Dropdown>
    );
}

export default DropdownSelector;
